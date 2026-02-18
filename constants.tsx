
import { Project, Specialization, MediaType, Review } from './types';

export const SPECIALIZATIONS: Specialization[] = [
  {
    id: 'komercni',
    name: 'Komerční tvorba',
    description: 'Profesionální vizuální obsah pro vaši značku. Od produktové fotografie po reklamní spoty a firemní prezentace.',
    image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Komerční fotografie a video | Profesionální vizuální obsah',
      seoDescription: 'Profesionální komerční fotografie a video pro vaši značku. Produktové kampaně, reklamní spoty, firemní prezentace a brandingová fotografie.',
      seoKeywords: 'komerční fotografie, reklamní video, produktová fotografie, firemní video, brandingová fotografie, PR fotografie',
    caseStudies: [
      'Produktové kampaně na sociální sítě',
      'Firemní videoportréty',
      'Reklamní spoty pro TV a web',
      'Lifestyle brandingová fotografie',
      'PR materiály pro tiskové zprávy',
      'E-commerce produktové listy',
      'Výrobní procesy a technické detaily',
      'Portréty vedení společnosti',
      'Obsah pro náborové kampaně',
      'Vizuální identita nové značky'
    ],
    values: ['Kreativní přístup', 'Špičková technika', 'Rychlé dodání']
  },
  {
    id: 'interiery',
    name: 'Architektura a interiéry',
    description: 'Specializované foto a video služby pro architekty, hotely a designéry. Zachycení prostoru s důrazem na světlo a kompozici.',
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Fotograf hotelů a interiérů | Architektonická fotografie',
      seoDescription: 'Profesionální fotografie hotelů, interiérů a architektury. Specializace na hotely, resorty, designové showroomy a rezidenční projekty s důrazem na světlo a kompozici.',
      seoKeywords: 'fotograf hotelů, architektonická fotografie, fotografie interiérů, hotel fotograf, fotograf pro architekty, designové fotografie',
    caseStudies: [
      'Prezentace hotelů a resortů',
      'Architektektonické soutěže',
      'Designové showroomy',
      'Rezidenční developerské projekty',
      'Dokumentace rekonstrukcí',
      'Průmyslové haly a sklady',
      'Noční fotografie budov',
      '360° virtuální prohlídky',
      'Letecké záběry architektury',
      'Vzorníky použitých materiálů'
    ],
    values: ['Precizní kompozice', 'Práce s přirozeným světlem', 'Technická dokonalost']
  },
  {
    id: 'stavebnictvi',
    name: 'Stavebnictví a průmysl',
    description: 'Dokumentace stavebních procesů, časosběry (timelapse) a inspekční záběry pro investory i marketing.',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Stavební timelapse a dokumentace | Průmyslové video',
      seoDescription: 'Profesionální časosběrná videa staveb, dokumentace stavebních procesů a inspekční dronové záběry pro stavební firmy, developery a investory.',
      seoKeywords: 'stavební timelapse, časosběr stavby, dokumentace stavby, průmyslová fotografie, stavební video, dronová inspekce',
    caseStudies: [
      'Časosběrná videa (timelapse)',
      'Dokumentace skrytých konstrukcí',
      'Předávací protokoly investorům',
      'Záběry z dronu pro kontrolu prací',
      'Marketingové materiály pro stavební firmy',
      'Bezpečnostní instruktážní videa',
      'Průřezové reportáže milníků stavby',
      'Dronová inspekce výškových budov',
      'Katalog referenčních staveb',
      'Krizová dokumentace stavu'
    ],
    values: ['Spolehlivost na stavbě', 'Bezpečnostní certifikace', 'Časosběrná expertíza']
  },
  {
    id: 'eventy',
    name: 'Eventy a reportáže',
    description: 'Atmosféra vašich akcí zachycená tak, jak jste ji prožívali. Konference, festivaly a firemní večírky.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Fotograf eventů a konferencí | Reportážní fotografie',
      seoDescription: 'Profesionální reportážní fotografie a video eventů. Konference, festivaly, firemní večírky, vernisáže a sportovní akce. Rychlé zpracování, emoce v každém snímku.',
      seoKeywords: 'fotograf eventů, fotograf konferencí, reportážní fotografie, firemní večírky, festival fotograf, event photography',
    caseStudies: [
      'Mezinárodní konference a summity',
      'Hudební festivaly a koncerty',
      'Firemní večírky a teambuildingy',
      'Vernisáže a výstavy',
      'Sportovní galavečery',
      'Slavnostní otvírání provozoven',
      'Módní přehlídky',
      'Tiskové konference',
      'Workshopy a vzdělávací akce',
      'Plesy a maturitní akce'
    ],
    values: ['Nenápadnost', 'Rychlé zpracování', 'Emoce v každém snímku']
  },
  {
    id: 'sport',
    name: 'Sport a akce',
    description: 'Dynamika a emoce v pohybu. Od extrémních sportů po týmové zápasy a promo sportovců.',
    image: 'https://images.unsplash.com/photo-1461896756913-c3b4696b3f94?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Sportovní fotografie a video | Akční záběry',
      seoDescription: 'Profesionální sportovní fotografie a video. Extrémní sporty, týmové zápasy, motorsport, promo materiály pro sportovce a kluby. Dynamika a emoce v pohybu.',
      seoKeywords: 'sportovní fotografie, sport video, akční fotografie, motorsport fotograf, fotograf pro sportovce, extrémní sporty',
    caseStudies: [
      'Extrémní sporty', 'Týmové sporty', 'Tréninková videa', 'Závody', 'Motorsport', 'Promo pro kluby', 'Portréty sportovců', 'E-sport', 'Vybavení v akci', 'Kempy'
    ],
    values: ['Rychlá reakce', 'Znalost disciplíny', 'Akční pohled']
  },
  {
    id: 'obce',
    name: 'Obce a samosprávy',
    description: 'Prezentace života v regionech, obecní časopisy a dokumentace investičních projektů.',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Fotografie pro obce a samosprávy | Dokumentace projektů',
      seoDescription: 'Profesionální fotografie a video pro obce a města. Obecní zpravodaje, letecké záběry, dokumentace investic, propagace cestovního ruchu a památek.',
      seoKeywords: 'fotograf pro obce, obecní fotografie, dokumentace investic, dronové záběry obce, fotografie památek, turistická propagace',
    caseStudies: [
      'Obecní zpravodaje', 'Turistické mapy', 'Letecké záběry', 'Dokumentace investic', 'Medailonky', 'Památky', 'Propagace cestovního ruchu', 'Evidence majetku', 'Webové stránky obce', 'Slavnosti'
    ],
    values: ['Lokální znalost', 'Kvalita pro tisk', 'Dlouhodobá spolupráce']
  },
  {
    id: 'destinace',
    name: 'Destinace a turismus',
    description: 'Inspirativní vizuály pro cestovní ruch, národní parky a volnočasové resorty.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Turistická fotografie | Destinace a cestovní ruch',
      seoDescription: 'Inspirativní fotografie a video pro cestovní ruch. Národní parky, turistické trasy, wellness resorty, UNESCO památky a marketingové kampaně destinací.',
      seoKeywords: 'turistická fotografie, fotograf destinací, cestovní ruch fotografie, národní parky, dronové záběry turistiky, resort fotografie',
    caseStudies: [
      'Národní parky', 'Turistické trasy', 'Wellness resorty', 'Gastroturistika', 'Zážitkové balíčky', 'Expedice', 'UNESCO památky', 'Rodinné atrakce', 'Průvodcovská videa', 'Marketingové kampaně'
    ],
    values: ['Atmosférické záběry', 'Dronové umění', 'Příběh místa']
  },
  {
    id: 'realitky',
    name: 'Reality a development',
    description: 'Prodejní videa a fotografie nemovitostí. Od luxusních vil po rozsáhlé developerské projekty.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Video pro reality | Fotografie nemovitostí a developerských projektů',
      seoDescription: 'Profesionální videoprohlídky a fotografie nemovitostí. Luxusní vily, developerské projekty, komerční prostory, AirBnB fotografie. Rychlé dodání, vysoká prodejní estetika.',
      seoKeywords: 'video pro reality, fotografie nemovitostí, videoprohlídka bytu, realitní fotograf, developerská fotografie, luxury real estate',
    caseStudies: [
      'Videoprohlídky', 'Půdorysy', 'Letecké mapování', 'Luxusní vily', 'AirBnB / Booking', 'Komerční prostory', 'Homestaging', 'Technologie domu', 'Okolí nemovitosti', 'Záběry z výšky'
    ],
    values: ['Rychlost dodání', 'Vysoká estetika', 'Prodejní potenciál']
  },
  {
    id: 'svatby',
    name: 'Svatby',
    description: 'Filmové zachycení vašeho velkého dne. Více na www.jakubminka.cz',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Svatební fotograf a kameraman | Filmové svatby',
      seoDescription: 'Profesionální svatební fotografie a video. Filmové zachycení vašeho velkého dne s důrazem na emoce a autentické okamžiky.',
      seoKeywords: 'svatební fotograf, svatební video, svatební kameraman, filmová svatba, svatební fotografie',
    caseStudies: [],
    values: [],
    externalUrl: 'https://www.jakubminka.cz'
  },
  {
    id: 'drony',
    name: 'Drony',
    description: 'Unikátní perspektiva z ptačího pohledu. Více na www.fotovideodronem.cz',
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=1200',
      seoTitle: 'Dronová fotografie a video | Letecké záběry',
      seoDescription: 'Profesionální dronová fotografie a video z ptačí perspektivy. Letecké záběry pro stavby, nemovitosti, eventy a turistické destinace.',
      seoKeywords: 'dronová fotografie, dronové video, letecké záběry, fotografie dronem, video dronem, aerial photography',
    caseStudies: [],
    values: [],
    externalUrl: 'https://www.fotovideodronem.cz'
  }
];

export const PROJECTS: Project[] = Array.from({ length: 40 }).map((_, i) => {
  const typeRoll = i % 10;
  let type = MediaType.IMAGE;
  if (typeRoll === 0 || typeRoll === 1) type = MediaType.VIDEO;
  if (typeRoll === 2) type = MediaType.BOTH;

  return {
    id: `project-${i}`,
    title: `Projekt ${i + 1}`,
    category: SPECIALIZATIONS[i % (SPECIALIZATIONS.length - 2)].name,
    categoryId: SPECIALIZATIONS[i % (SPECIALIZATIONS.length - 2)].id,
    description: `Detailní popis projektu ${i + 1}. Tato zakázka zahrnovala komplexní dodání foto i video dokumentace.`,
    shortDescription: `Realizace pro klienta v oboru ${SPECIALIZATIONS[i % (SPECIALIZATIONS.length - 2)].name}.`,
    thumbnailUrl: `https://picsum.photos/id/${(i * 3) + 100}/${i % 2 === 0 ? 1200 : 1400}/${i % 3 === 0 ? 800 : 900}`,
    thumbnailSource: 'pc',
    date: new Date().toISOString(),
    type: type,
    gallery: [
      {
        id: `gallery-${i}-1`,
        url: `https://picsum.photos/id/${(i * 3) + 101}/1920/1080`,
        type: 'image',
        source: 'pc'
      },
      {
        id: `gallery-${i}-2`,
        url: `https://picsum.photos/id/${(i * 3) + 102}/1920/1080`,
        type: 'image',
        source: 'pc'
      },
      {
        id: `gallery-${i}-3`,
        url: `https://picsum.photos/id/${(i * 3) + 103}/1920/1080`,
        type: 'image',
        source: 'pc'
      }
    ],
    servicesDelivered: 'Fotografování\nStrihová práce\nKorekce barvy\nGrafická úprava'
  };
});

export const REVIEWS: Review[] = [];

