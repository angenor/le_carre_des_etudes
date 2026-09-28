#!/bin/bash

# ===========================================
# Le Carre des Etudes - Script de deploiement
# ===========================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_USER="root"
REMOTE_HOST="31.220.73.105"
REMOTE_DIR="/opt/le_carre_des_etudes"
APP_REPO="https://github.com/angenor/le_carre_des_etudes.git"
DEPLOY_BRANCH="main"

echo -e "${GREEN}=== Le Carre des Etudes - Deploiement ===${NC}"

# Configuration SSH sans mot de passe
setup_ssh() {
    echo -e "${GREEN}[SSH] Configuration de l'acces sans mot de passe...${NC}"

    if ssh -o BatchMode=yes -o ConnectTimeout=5 ${REMOTE_USER}@${REMOTE_HOST} "echo ok" &>/dev/null; then
        echo -e "${GREEN}Acces SSH deja configure.${NC}"
        return 0
    fi

    echo -e "${YELLOW}Copie de la cle SSH vers le serveur (mot de passe requis une seule fois)...${NC}"
    ssh-copy-id -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST}

    echo -e "${GREEN}Acces SSH sans mot de passe configure.${NC}"
}

# Premier setup du serveur
setup() {
    setup_ssh

    echo -e "${GREEN}[1/4] Installation de Docker...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
        if ! command -v docker &> /dev/null; then
            echo "Installation de Docker..."
            curl -fsSL https://get.docker.com | sh
            systemctl enable docker
            systemctl start docker
        fi

        if ! docker compose version &> /dev/null; then
            echo "Installation de Docker Compose..."
            apt-get update
            apt-get install -y docker-compose-plugin
        fi

        if ! command -v git &> /dev/null; then
            apt-get update
            apt-get install -y git
        fi

        echo "Docker: $(docker --version)"
        echo "Docker Compose: $(docker compose version)"
        echo "Git: $(git --version)"
ENDSSH

    echo -e "${GREEN}[2/4] Clonage du depot...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
        mkdir -p ${REMOTE_DIR}
        if [ ! -d "${REMOTE_DIR}/.git" ]; then
            git clone ${APP_REPO} ${REMOTE_DIR}
        fi
ENDSSH

    echo -e "${GREEN}[3/4] Upload de la configuration...${NC}"
    scp .env.example ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

    echo -e "${GREEN}[4/4] Generation du .env de production...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
        cd /opt/le_carre_des_etudes

        if [ ! -f ".env" ]; then
            ADMIN_PWD=$(openssl rand -hex 16)
            SESSION_SECRET=$(openssl rand -hex 24)
            cat > .env << EOF
PORT=3000
DATABASE_URL="file:/app/data/production.db"
ADMIN_PASSWORD="${ADMIN_PWD}"
NUXT_SESSION_SECRET="${SESSION_SECRET}"
EOF
            echo ""
            echo "Fichier .env cree."
            echo "  ADMIN_PASSWORD: ${ADMIN_PWD}"
            echo ""
            echo "Conservez ce mot de passe en lieu sur !"
        else
            echo ".env existe deja, pas de modification."
        fi
ENDSSH

    echo -e "${GREEN}=== Setup termine ===${NC}"
    echo ""
    echo -e "${YELLOW}Prochaine etape :${NC}"
    echo "  ./deploy.sh deploy"
}

# Deploiement complet
deploy() {
    echo -e "${GREEN}[1/3] Mise a jour du code depuis GitHub...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH || { echo -e "${RED}Echec de la mise a jour du code.${NC}"; exit 1; }
        set -e
        cd ${REMOTE_DIR}
        git fetch origin
        git checkout ${DEPLOY_BRANCH} 2>/dev/null || git checkout -b ${DEPLOY_BRANCH} origin/${DEPLOY_BRANCH}
        git reset --hard origin/${DEPLOY_BRANCH}
        git clean -fd app/ server/ prisma/
        echo "Commit deploye : \$(git log -1 --oneline)"
ENDSSH

    echo -e "${GREEN}[2/3] Build et demarrage des conteneurs...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH || { echo -e "${RED}Echec du build.${NC}"; exit 1; }
        set -e
        cd ${REMOTE_DIR}

        if [ ! -f ".env" ]; then
            echo "ERREUR: fichier .env introuvable !"
            echo "Lancez d'abord : ./deploy.sh setup"
            exit 1
        fi

        docker compose down || true
        docker compose build --no-cache
        docker compose up -d

        docker image prune -f
ENDSSH

    echo -e "${GREEN}[3/3] Verification du deploiement...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
        cd ${REMOTE_DIR}
        echo "Statut des conteneurs :"
        docker compose ps

        echo ""
        echo "Attente du demarrage..."
        sleep 10

        echo ""
        curl -sf http://localhost > /dev/null && echo "Application OK" || echo "Application pas encore prete"
ENDSSH

    echo -e "${GREEN}=== Deploiement termine ===${NC}"
    echo -e "Site disponible : https://lecarredesetudes.com"
}

# Mise a jour rapide
update() {
    echo -e "${GREEN}Mise a jour du code et redemarrage...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH || { echo -e "${RED}Echec de la mise a jour.${NC}"; exit 1; }
        set -e
        cd ${REMOTE_DIR}

        # Le serveur est une copie jetable : on force l'alignement sur origin.
        # (un simple 'git pull' echoue en silence si des fichiers ont ete
        #  modifies directement en production)
        git fetch origin
        git reset --hard origin/${DEPLOY_BRANCH}
        git clean -fd app/ server/ prisma/

        echo "Commit deploye : \$(git log -1 --oneline)"

        docker compose build
        docker compose up -d
ENDSSH
    echo -e "${GREEN}Mise a jour terminee !${NC}"
}

# Seed des contenus (editions SALM) dans le conteneur : idempotent, ne touche jamais aux inscriptions
seed() {
    echo -e "${GREEN}Seed des contenus (npx prisma db seed)...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker compose exec -T app npx prisma db seed" \
        || { echo -e "${RED}Echec du seed.${NC}"; exit 1; }
    echo -e "${GREEN}Seed termine.${NC}"
}

# Logs
logs() {
    SERVICE=${2:-}
    if [ -n "$SERVICE" ]; then
        ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker compose logs -f ${SERVICE}"
    else
        ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker compose logs -f"
    fi
}

# Redemarrer
restart() {
    ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker compose restart"
}

# Arreter
stop() {
    ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker compose down"
}

# Statut
status() {
    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
        cd ${REMOTE_DIR}
        echo "=== Conteneurs ==="
        docker compose ps

        echo ""
        echo "=== Dernier commit ==="
        git log -1 --oneline

        echo ""
        echo "=== Disque ==="
        df -h / | tail -1

        echo ""
        echo "=== Memoire ==="
        free -h | head -2
ENDSSH
}

# SSL avec Let's Encrypt
# Les certificats vivent dans le volume Docker lu par nginx (le_carre_des_etudes_letsencrypt), jamais dans
# le /etc/letsencrypt de l'hôte. Certbot tourne en conteneur :
# - émission : mode standalone, nginx arrêté le temps de libérer le port 80 (il ne démarre pas sans certificat) ;
# - renouvellement (cron quotidien) : mode webroot via /.well-known/acme-challenge/ de nginx, sans coupure.
# La caméra du contrôle d'entrée SALM exige un certificat valide le jour du salon (specs/008, R2).
ssl() {
    DOMAIN=${2:?Usage: ./deploy.sh ssl mon-domaine.com}
    echo -e "${GREEN}Configuration SSL pour ${DOMAIN}...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
        cd ${REMOTE_DIR} || exit 1
        docker volume create le_carre_des_etudes_letsencrypt >/dev/null

        # Emission ou remplacement du certificat : nginx libere le port 80, puis redemarre quoi qu'il arrive
        docker compose stop nginx || true
        docker run --rm -p 80:80 \\
            -v le_carre_des_etudes_letsencrypt:/etc/letsencrypt \\
            certbot/certbot certonly --standalone --cert-name ${DOMAIN} -d ${DOMAIN} \\
            --non-interactive --agree-tos --email admin@${DOMAIN} --keep-until-expiring \\
            || echo "ECHEC de certbot : certificat inchange"
        docker compose up -d nginx

        # Renouvellement automatique (remplace les anciennes lignes certbot de la crontab)
        WEBROOT_VOLUME=\$(docker volume ls -q | grep 'certbot-webroot\$' | head -1)
        (crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * cd ${REMOTE_DIR} && docker run --rm -v le_carre_des_etudes_letsencrypt:/etc/letsencrypt -v \$WEBROOT_VOLUME:/var/www/certbot certbot/certbot renew --quiet --webroot -w /var/www/certbot && docker compose exec -T nginx nginx -s reload") | crontab -

        echo ""
        echo "Certificat SSL installe pour ${DOMAIN} ; renouvellement :"
        crontab -l | grep certbot
        docker run --rm -v le_carre_des_etudes_letsencrypt:/etc/letsencrypt certbot/certbot certificates
ENDSSH
}

# Backup de la base SQLite
backup() {
    BACKUP_DIR="backups"
    mkdir -p ${BACKUP_DIR}
    BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).db"
    echo -e "${GREEN}Sauvegarde de la base de donnees...${NC}"
    ssh ${REMOTE_USER}@${REMOTE_HOST} "docker compose -f ${REMOTE_DIR}/docker-compose.yml exec -T app cat /app/data/production.db" > ${BACKUP_FILE}
    echo -e "${GREEN}Sauvegarde enregistree : ${BACKUP_FILE}${NC}"
}

# Connexion SSH
connect() {
    ssh ${REMOTE_USER}@${REMOTE_HOST} -t "cd ${REMOTE_DIR} && bash"
}

# Menu principal
case "$1" in
    setup)
        setup
        ;;
    deploy)
        deploy
        ;;
    update)
        update
        ;;
    seed)
        seed
        ;;
    logs)
        logs "$@"
        ;;
    restart)
        restart
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    ssl)
        ssl "$@"
        ;;
    backup)
        backup
        ;;
    connect)
        connect
        ;;
    *)
        echo "Usage: $0 {commande}"
        echo ""
        echo "Commandes :"
        echo "  setup          - Premier setup du serveur (Docker, clone, .env)"
        echo "  deploy         - Deploiement complet (pull, build, restart)"
        echo "  update         - Mise a jour rapide (pull, rebuild)"
        echo "  seed           - Initialiser les éditions SALM absentes (n'écrase jamais le contenu géré dans le back-office)"
        echo "  logs [service] - Voir les logs"
        echo "  restart        - Redemarrer les conteneurs"
        echo "  stop           - Arreter les conteneurs"
        echo "  status         - Afficher l'etat du serveur"
        echo "  ssl <domaine>  - Configurer SSL avec Let's Encrypt"
        echo "  backup         - Sauvegarder la base SQLite en local"
        echo "  connect        - Se connecter en SSH au serveur"
        echo ""
        echo "Exemples :"
        echo "  $0 setup                # Premier setup"
        echo "  $0 deploy               # Deployer l'application"
        echo "  $0 seed                 # Base neuve : éditions SALM initiales"
        echo "  $0 logs app             # Voir les logs de l'app"
        echo "  $0 ssl mondomaine.com   # Configurer HTTPS"
        exit 1
        ;;
esac
