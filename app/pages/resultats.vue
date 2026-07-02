<script setup lang="ts">
// -------------------------------------------------------------------------
// Résultats SCHOLARSHIP EXAM 2025 — page éphémère, données en dur (urgence).
// -------------------------------------------------------------------------
useHead({
  title: 'Résultats SCHOLARSHIP EXAM 2025 — Le Carré des Études',
  meta: [
    { name: 'description', content: 'Liste officielle des admis au SCHOLARSHIP EXAM 2025.' },
  ],
})

interface Resultat {
  nom: string
  naissance: string
  note: number
  statut: string
}

// Podium (les 3 premiers)
const podium: Resultat[] = [
  { nom: 'Zokou grâce Emmanuella', naissance: '2009', note: 84.25, statut: 'LAURÉAT 1' },
  { nom: 'Kouamé Famien Yvann', naissance: '2008', note: 83, statut: '2e PRIX' },
  { nom: 'N’takpé ange -joslyn', naissance: '2007', note: 82, statut: '3e PRIX' },
]

// Admis (statut ADMIS) — ordre par note décroissante, tel que fourni.
const admis: Resultat[] = [
  { nom: 'Koffi Martial christopher', naissance: '', note: 76, statut: 'ADMIS' },
  { nom: 'Kangah Ahomoli syntyche', naissance: '2009', note: 75, statut: 'ADMIS' },
  { nom: 'Coulibaly Alassane siaka', naissance: '2008', note: 74, statut: 'ADMIS' },
  { nom: 'Adou brou Julien Ehiman', naissance: '2006', note: 73, statut: 'ADMIS' },
  { nom: 'Kouatchein n’cho jean noel', naissance: '2005', note: 72, statut: 'ADMIS' },
  { nom: 'N’cho beda sephora', naissance: '2005', note: 72, statut: 'ADMIS' },
  { nom: 'N’guessan Akissi Michaella Naomi', naissance: '2007', note: 72, statut: 'ADMIS' },
  { nom: 'Yao kouame ange Yoan christian', naissance: '2010', note: 72, statut: 'ADMIS' },
  { nom: 'koffi Amenan esther sabine Lauriane', naissance: '2004', note: 71, statut: 'ADMIS' },
  { nom: 'Amazofo kouamé Aya marie orlane', naissance: '2009', note: 70, statut: 'ADMIS' },
  { nom: 'Bah daouda', naissance: '2004', note: 70, statut: 'ADMIS' },
  { nom: 'Kouamé kouassi jean marc Delou', naissance: '2006', note: 68, statut: 'ADMIS' },
  { nom: 'Touré Abdou Mohamed', naissance: '2006', note: 68, statut: 'ADMIS' },
  { nom: 'Ouedraogo romeo sylvain', naissance: '2000', note: 67, statut: 'ADMIS' },
  { nom: 'Vonié kouamy lou regina esther', naissance: '2007', note: 67, statut: 'ADMIS' },
  { nom: 'Mondon Yvan Christ Erwin', naissance: '2007', note: 66, statut: 'ADMIS' },
  { nom: 'Vanie Marc yvan', naissance: '2004', note: 66, statut: 'ADMIS' },
  { nom: 'Zina Moustapha karamogo Talir', naissance: '2009', note: 66, statut: 'ADMIS' },
  { nom: 'Lagou  ameme getheme moy', naissance: '2004', note: 65, statut: 'ADMIS' },
  { nom: 'Adou    Akoun Cyrille', naissance: '2000', note: 64.5, statut: 'ADMIS' },
  { nom: 'Kouadio Aman Adjoua grâce', naissance: '2007', note: 64, statut: 'ADMIS' },
  { nom: 'KOuadio kouassi hipolite', naissance: '2002', note: 64, statut: 'ADMIS' },
  { nom: 'Cocora   Grah Claude-olivie', naissance: '2002', note: 63.25, statut: 'ADMIS' },
  { nom: 'Doumbia Moussa samory', naissance: '2005', note: 63, statut: 'ADMIS' },
  { nom: 'Lebato Piere Grace pricile', naissance: '2006', note: 63, statut: 'ADMIS' },
  { nom: 'Adou Ange Emmanuel', naissance: '2008', note: 62, statut: 'ADMIS' },
  { nom: 'Kouakou    Koffi fiacre Israël', naissance: '1999', note: 62, statut: 'ADMIS' },
  { nom: 'Cissé Mariam', naissance: '2006', note: 61, statut: 'ADMIS' },
  { nom: 'Kouame   Affia Evodie Esther', naissance: '2005', note: 60, statut: 'ADMIS' },
  { nom: 'Kouassi   Atte Éric vianney', naissance: '2000', note: 60, statut: 'ADMIS' },
  { nom: 'Nonni Alliou', naissance: '1999', note: 60, statut: 'ADMIS' },
  { nom: 'Okrou   Beto Noel Jean Didier', naissance: '2008', note: 60, statut: 'ADMIS' },
  { nom: 'Traoré Seydou', naissance: '2006', note: 59, statut: 'ADMIS' },
  { nom: 'Kouassi Mianim Hugues Emerson', naissance: '2003', note: 58.25, statut: 'ADMIS' },
  { nom: 'Konan ahou Daniella', naissance: '2005', note: 58, statut: 'ADMIS' },
  { nom: 'Kouassi Adja Maeva priscille', naissance: '2000', note: 58, statut: 'ADMIS' },
  { nom: 'N’Goua kouadio Marc Harold', naissance: '2009', note: 58, statut: 'ADMIS' },
  { nom: 'TIEOUA kouakou jean Justin', naissance: '2005', note: 58, statut: 'ADMIS' },
  { nom: 'Kouadio Amoin linda laurelle', naissance: '2007', note: 57, statut: 'ADMIS' },
  { nom: 'Koffi Kobenan verge', naissance: '2002', note: 56.25, statut: 'ADMIS' },
  { nom: 'Amon   Ahounou Ashley', naissance: '2008', note: 56, statut: 'ADMIS' },
  { nom: 'Degbo    Yavo Christ Samuel', naissance: '2008', note: 56, statut: 'ADMIS' },
  { nom: 'Sedegnan ange joel', naissance: '2003', note: 56, statut: 'ADMIS' },
  { nom: 'Sekongo dosso Mon abraham', naissance: '2004', note: 56, statut: 'ADMIS' },
  { nom: 'Tikana souahi bou', naissance: '2002', note: 56, statut: 'ADMIS' },
  { nom: 'Ake yekin Seh Marie Ruth', naissance: '2005', note: 55, statut: 'ADMIS' },
  { nom: 'Amoa   Joëlle ornella', naissance: '2006', note: 55, statut: 'ADMIS' },
  { nom: 'Konan adjoua jemima victoire', naissance: '2004', note: 55, statut: 'ADMIS' },
  { nom: 'Koné gnoh Célestine amoin', naissance: '2006', note: 55, statut: 'ADMIS' },
  { nom: 'Kouadio Kouassi bienvenu Thomas', naissance: '2003', note: 55, statut: 'ADMIS' },
  { nom: 'Kouassi François -xavier Messièlé', naissance: '2007', note: 55, statut: 'ADMIS' },
  { nom: 'SEA blé Kede Boris lago', naissance: '2004', note: 55, statut: 'ADMIS' },
  { nom: 'Yao kouame abel', naissance: '2005', note: 55, statut: 'ADMIS' },
  { nom: 'Fofana pinguin sali', naissance: '2008', note: 54, statut: 'ADMIS' },
  { nom: 'Foto   Fidèle innocents', naissance: '2007', note: 53.75, statut: 'ADMIS' },
  { nom: 'Kouakou aya Raymonde', naissance: '1998', note: 53.75, statut: 'ADMIS' },
  { nom: 'Kouassi Jean carler Désire', naissance: '2000', note: 53.75, statut: 'ADMIS' },
  { nom: 'Fofana Abou', naissance: '2003', note: 53, statut: 'ADMIS' },
  { nom: 'Koulibaly Nourh kader jean yves', naissance: '2003', note: 53, statut: 'ADMIS' },
  { nom: 'Daouda dao', naissance: '1999', note: 52.5, statut: 'ADMIS' },
  { nom: 'Abdoul   Sangaré Yoann', naissance: '2008', note: 52, statut: 'ADMIS' },
  { nom: 'Bossian   Kilda tchinkoli Regina Pricilla', naissance: '2005', note: 52, statut: 'ADMIS' },
  { nom: 'Koffi  Paola-Yann Arielle', naissance: '2008', note: 52, statut: 'ADMIS' },
  { nom: 'Yeo    Foungnigue Adama', naissance: '2003', note: 52, statut: 'ADMIS' },
  { nom: 'Adji wayou elie', naissance: '2008', note: 51, statut: 'ADMIS' },
  { nom: 'Sylla Mariam aba-fatim', naissance: '2008', note: 51, statut: 'ADMIS' },
  { nom: 'Aboly   Franck J.', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Ablo koffi jean david nathanael', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'ADENTO YANN', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'ADONON ABDUL', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Agbedje ossohou', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Agoua ange Michel lamadone', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Ahoussou yao yann', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'AHOUTOU WILFRIED', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'Ake assawa gemima Anne', naissance: '2008', note: 50, statut: 'ADMIS' },
  { nom: 'AKMEL MELEDJE', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'ALLA ADJOUA', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Allassisem Fabien', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Amaye gnarouhonon Eunice', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Amon', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'ANIN SOPIE', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Apri   Gnango Guy Hans', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'ASSOUMOU KINIMO', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'ATSE', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Azonyito', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Bakayoko yacouba', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'Bamba Ibrahim', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'Bamba tenin goura', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Bazo   Alexis', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Bekabo kouadio jeremie schalom', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Bekourou Douhoure', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Berte Abiba anicette', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Bobia blanche Eunice', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'Boko Affoua Marie Catherine', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'Bou Gouhi zoukou grâce morelle', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Bouda Cedrick', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Camara Aïcha bienvenue', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Coulibaly   Aga Marie-grace Eunice', naissance: '2008', note: 50, statut: 'ADMIS' },
  { nom: 'Coulibaly Moulayo', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Coulibaly siaka', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'DADI ZAHOUI', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Dao Tahirou Isaac', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Daouda mah Samuel', naissance: '2009', note: 50, statut: 'ADMIS' },
  { nom: 'Diarranouba Astha Malicka', naissance: '2009', note: 50, statut: 'ADMIS' },
  { nom: 'DIBY KONAN', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'DiERE', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Digre Arriko Grégoire Christ Emmanuel', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'DIOMANDE STEPHANE', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'DJIHI KANELE', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'DONGO KOUAKOU', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'Ekon', naissance: '1999', note: 50, statut: 'ADMIS' },
  { nom: 'Enangny wahon Erika Lucrère', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Fadiga    Mahamadou dibassy', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Fanny    Badiomanga', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Fegnin   Gnangra prince Aaron', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'GBALLOU OGNIMO', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'Gbazou prisca Esther', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'GNABA kouakou Augustin', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Gnahore zeh Esther Guina', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Gnisson moayé othnielle', naissance: '', note: 50, statut: 'ADMIS' },
  { nom: 'GOMAH', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'GOUESSE HASSAN', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'Guei Oceanne  Paule', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'HAMDOU YACOUBA', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'HUE BI CEDRIC', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'KACOU', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Kadia Ariel Chris Yvan', naissance: '', note: 50, statut: 'ADMIS' },
  { nom: 'KADJA JEAN', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Kanie Fatoumata', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'KAPET SIDIBE', naissance: '1999', note: 50, statut: 'ADMIS' },
  { nom: 'Keita Moustapha', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'Koffi   Paul Fernand', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Koffi assa jean carême Josué', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'KONAN', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Konan    N’da Ahou Christelle', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'Koné    Bley valesca', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Kone  Moussa', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Kone Bamory', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Kone Hamed', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'Koné katchinnin awa', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Kouadio   Ahou marthe elgina', naissance: '1999', note: 50, statut: 'ADMIS' },
  { nom: 'Kouadio blé marc elie', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'KOUADIO KAN', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Kouadio kouassi Wilfried', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'kouakou kassi marc', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'KOUAME AKISSI', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Kouame kouassi Christophe', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'Kouame oura johanna sandrine', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'Kouassi   N’guessan victoire Rachelle', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Kouassi Ando Esdras pelex', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Kouassi Bath rigoberte Emmanuela', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'KOUEDAN AKE', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'Koyé Boa jean orthiniel', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'KPRE yao salomon', naissance: '2008', note: 50, statut: 'ADMIS' },
  { nom: 'LASME CYRILLE', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'LOUA JEMIMA', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'M’Baye Fatou josee', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'N’doua N’da kouame moïse', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'N’dri Konan ephrem-regis', naissance: '2009', note: 50, statut: 'ADMIS' },
  { nom: 'Nenin    Léonce', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'ORE TOGBA SERGE', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'Ouattara Be', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'OUOHI SAMUEL', naissance: '2008', note: 50, statut: 'ADMIS' },
  { nom: 'Poku Dwomoh kesse evans', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'Pooda   Ollo narcisse', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Sagou   Degni assoh Philippe Salomon', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Samassi vassanassi', naissance: '2006', note: 50, statut: 'ADMIS' },
  { nom: 'SANOGO', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'Sawadogo    Ange Yannick Emmanuel', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'Sebla gnaba Romeo', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'Senayah   Eklou jean', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'SENAYAH EKLOU', naissance: '2004', note: 50, statut: 'ADMIS' },
  { nom: 'Sery Tilla josiane', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'Soumahoro vakaramoko', naissance: '2003', note: 50, statut: 'ADMIS' },
  { nom: 'SY SAVANE', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'Tah lou tanan estelle-flavia', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'TAHA', naissance: '2009', note: 50, statut: 'ADMIS' },
  { nom: 'Tety', naissance: '2005', note: 50, statut: 'ADMIS' },
  { nom: 'Tia', naissance: '2008', note: 50, statut: 'ADMIS' },
  { nom: 'Tiekora constant Joseph junior', naissance: '2002', note: 50, statut: 'ADMIS' },
  { nom: 'Tressia Boli Allan', naissance: '2001', note: 50, statut: 'ADMIS' },
  { nom: 'Whadja marie grâce Emmanuella', naissance: '2008', note: 50, statut: 'ADMIS' },
  { nom: 'YAO', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'YOBOUET AMOIN', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'Yokoli Emmanuel', naissance: '2007', note: 50, statut: 'ADMIS' },
  { nom: 'Zakpo liliane', naissance: '2000', note: 50, statut: 'ADMIS' },
  { nom: 'ZOUKOUAN', naissance: '2001', note: 50, statut: 'ADMIS' },
]

// Liste complète (podium + admis) pour le tableau et la recherche.
const tous: Resultat[] = [...podium, ...admis]
const totalAdmis = tous.length

// Recherche par nom (insensible à la casse et aux accents).
const recherche = ref('')

function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const resultatsFiltres = computed(() => {
  const q = normaliser(recherche.value)
  if (!q) return tous
  return tous.filter((r) => normaliser(r.nom).includes(q))
})

function statutClasses(statut: string): string {
  if (statut.startsWith('LAURÉAT')) return 'bg-amber-400 text-gray-900'
  if (statut.includes('2e')) return 'bg-gray-300 text-gray-900'
  if (statut.includes('3e')) return 'bg-amber-700/80 text-amber-50'
  return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
}

const medailles = ['🥇', '🥈', '🥉']
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gray-950 pb-16 pt-32 sm:pb-20 sm:pt-40">
      <!-- Grille de points + halos -->
      <svg class="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="res-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(251,191,36,0.12)" />
          </pattern>
          <radialGradient id="res-fade" cx="50%" cy="25%" r="60%">
            <stop offset="0%" stop-color="rgba(221,132,72,0.18)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#res-grid)" />
        <rect width="100%" height="100%" fill="url(#res-fade)" />
      </svg>
      <div class="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />

      <div class="relative mx-auto max-w-5xl px-6 text-center">
        <span class="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-400 uppercase">
          Résultats officiels
        </span>
        <h1 class="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          SCHOLARSHIP
          <span class="bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">EXAM</span>
          2025
        </h1>
        <p class="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
          Liste officielle des admis. Félicitations à toutes et à tous&nbsp;!
        </p>
        <p class="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
          <span class="h-2 w-2 rounded-full bg-emerald-400" />
          {{ totalAdmis }} admis
        </p>
      </div>
    </section>

    <!-- Podium -->
    <section class="relative pb-8">
      <div class="mx-auto max-w-5xl px-6">
        <div class="grid gap-5 sm:grid-cols-3">
          <div
            v-for="(p, i) in podium"
            :key="p.nom"
            class="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gray-900/60 p-6 text-center backdrop-blur"
            :class="i === 0 ? 'sm:-translate-y-3 border-amber-400/50 shadow-lg shadow-amber-500/10' : ''"
          >
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
            <div class="text-4xl">{{ medailles[i] }}</div>
            <h3 class="mt-3 text-lg font-bold text-white">{{ p.nom }}</h3>
            <p v-if="p.naissance" class="mt-1 text-xs text-gray-500">Né(e) en {{ p.naissance }}</p>
            <div class="mt-4 flex items-center justify-center gap-3">
              <span class="text-2xl font-bold text-amber-400">{{ p.note }}</span>
              <span
                class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                :class="statutClasses(p.statut)"
              >{{ p.statut }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tableau ADMIS -->
    <section class="relative pb-24">
      <div class="mx-auto max-w-5xl px-6">
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 class="text-2xl font-bold tracking-tight text-white">
            ADMIS
          </h2>
          <!-- Recherche -->
          <div class="relative w-full sm:max-w-xs">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              v-model="recherche"
              type="search"
              placeholder="Rechercher un nom…"
              class="w-full rounded-full border border-gray-800 bg-gray-900/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
            >
          </div>
        </div>

        <!-- Tableau -->
        <div class="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/40">
          <table class="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr class="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                <th class="px-4 py-3 font-semibold">#</th>
                <th class="px-4 py-3 font-semibold">Nom et prénoms</th>
                <th class="px-4 py-3 font-semibold">Année de naissance</th>
                <th class="px-4 py-3 text-right font-semibold">Note</th>
                <th class="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in resultatsFiltres"
                :key="r.nom + i"
                class="border-b border-gray-800/60 transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <td class="px-4 py-3 text-gray-600 tabular-nums">{{ i + 1 }}</td>
                <td class="px-4 py-3 font-medium text-white">{{ r.nom }}</td>
                <td class="px-4 py-3 text-gray-400 tabular-nums">{{ r.naissance || '—' }}</td>
                <td class="px-4 py-3 text-right font-semibold text-amber-400 tabular-nums">{{ r.note }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                    :class="statutClasses(r.statut)"
                  >{{ r.statut }}</span>
                </td>
              </tr>
              <tr v-if="!resultatsFiltres.length">
                <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-500">
                  Aucun résultat pour « {{ recherche }} ».
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="mt-6 text-center text-xs text-gray-600">
          Le Carré des Études — SCHOLARSHIP EXAM 2025.
        </p>
      </div>
    </section>
  </div>
</template>
