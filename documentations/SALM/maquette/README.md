# Maquette — module SALM

Maquette validée de la partie **publique** du module SALM (Salon International des Licences et Masters de Côte d'Ivoire).
Le back-office n'a **pas** de maquette : il doit reprendre les patterns de l'admin existant (`app/layouts/admin.vue`, pages `app/pages/admin/*`).

- Canevas en ligne (interactif, privé) : https://claude.ai/artifact/LxBDV2LoBxzUQEdgWETbtf
- Sources de contenu : `documentations/brouillons/` (onglet SALM, chronogramme 2027, badge 2026)
- Formulaire exposants d'origine (Google Form) : https://docs.google.com/forms/d/e/1FAIpQLScW4EKHLpisaZxLzs4O-8m84vZzIkIvixcuQ6mht5VLEtp71g/viewform

## Écrans

| Fichier | Taille | Contenu |
|---|---|---|
| `page-desktop.dc.html` | 1440 × 7060 | Page `/salm` : hero vidéo + compte à rebours, « Deux façons de participer », Pourquoi le SALM, programme d'activité, chronogramme 2 jours, Le canapé du SALM (9 vidéos), catalogue photos, appel final + contacts |
| `page-mobile.dc.html` | 390 × 3720 | Version mobile des sections principales (chronogramme avec onglets Jour 1 / Jour 2) |
| `inscription-etudiant.dc.html` | 1440 × 1000 | Formulaire étudiant **3 champs** (Nom & prénoms, Numéro de téléphone, Niveau d'étude) + aperçu live du badge → écran « Félicitations » + téléchargement PDF |
| `inscription-ecole.dc.html` | 1440 × 1000 | Formulaire établissement en 3 étapes (établissement & programmes → exposants & stand → « Présence confirmée »). **Aucun badge.** |
| `badge-etudiant.dc.html` | 1440 × 1040 | Badge PDF 10 × 15 cm, recto (nom, niveau, n° SALM27-XXXXXX, QR code) / verso (infos pratiques) |

## Lire les fichiers `.dc.html`

Ce sont des composants du canevas de design, pas des pages autonomes : ils ne s'ouvrent pas tels quels dans un navigateur.
Ils servent de **référence de structure, de textes et de styles** :

- tout le style est en `style="…"` inline (valeurs exactes en px et en hex) ;
- `{{accent}}` = couleur d'accent SALM `#D5570B` ; `{{…}}` ailleurs = valeurs dynamiques calculées dans le `<script type="text/x-dc">` en bas de fichier ;
- `<sc-for>` = boucle, `<sc-if>` = affichage conditionnel ;
- les images pointent vers `images/` (photos recadrées depuis l'onglet SALM, à remplacer par les visuels HD).

## Repères visuels

- Fond sombre du site : `#0B0B0D`, surfaces `#141417` / `#16161A` / `#1C1C21`, bordures `#2A2A31`
- Accent SALM : `#D5570B` (fonds sous texte blanc, contraste 5,2:1) ; orange texte sur fond sombre : `#F4792B`
- Accent du site conservé pour la navbar et la mise en avant « Le Carré des Études » : ambre `#FBBF24`
- Polices : Montserrat (titres), DM Sans (texte), Yellowtail (mot « Salm » manuscrit, en remplacement du logo 2026)

## Placeholders à remplacer

`[LIEU À CONFIRMER]`, titres/invités des 9 vidéos, `[Surface · prestations · tarif]` des stands, nombre de photos du catalogue, affiche officielle 2027, logo « Salm 2027 » officiel.
