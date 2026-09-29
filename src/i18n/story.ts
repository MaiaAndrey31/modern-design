import type { Locale } from "@/i18n/dictionary";

/**
 * The Story — chapter narrative, PT/EN.
 *
 * Copy comes verbatim from the artist team's briefing. The CMS timeline
 * (TimelineEvent) only stores one English version and has no fields for
 * place/phase, and the schema must not change — so the narrative lives with
 * the site's other interface copy, while the CMS still supplies the section
 * heading, real photographs (matched by `cmsYear`) and any milestone the team
 * adds later (see mergeChapters in sections/Story.tsx).
 *
 * Never add facts here that the team hasn't confirmed.
 */

type T = Record<Locale, string>;

export type PlaceKey = "alfenas" | "varginha" | "saoPaulo" | "pousoAlegre" | "bh" | "rio" | "russia";

/** [lat, lon] — used only for the abstract geography layer. */
export const PLACES: Record<PlaceKey, { at: [number, number]; name: T }> = {
  alfenas: { at: [-21.43, -45.95], name: { en: "Alfenas", pt: "Alfenas" } },
  varginha: { at: [-21.55, -45.43], name: { en: "Varginha", pt: "Varginha" } },
  saoPaulo: { at: [-23.55, -46.63], name: { en: "São Paulo", pt: "São Paulo" } },
  pousoAlegre: { at: [-22.23, -45.94], name: { en: "Pouso Alegre", pt: "Pouso Alegre" } },
  bh: { at: [-19.92, -43.94], name: { en: "Belo Horizonte", pt: "Belo Horizonte" } },
  rio: { at: [-22.91, -43.17], name: { en: "Rio de Janeiro", pt: "Rio de Janeiro" } },
  russia: { at: [55.75, 37.62], name: { en: "Russia", pt: "Rússia" } },
};

export type MapView = "alfenas" | "minas" | "southeast" | "brazil" | "world";

export interface ChapterGeo {
  /** One view, or a sequence played in order (e.g. Brazil → Minas → Alfenas). */
  view: MapView | MapView[];
  /** Route drawn when this chapter becomes active; it stays (dimmed) afterwards. */
  route?: [PlaceKey, PlaceKey];
  /** Places labelled while this chapter is active. */
  labels?: PlaceKey[];
  pulse?: PlaceKey;
  /** Expanding rings around Minas — "many cities" without naming any. */
  rings?: boolean;
}

export type ChapterVisual = "record" | "record-spin" | "map" | "scale" | "signal" | "photo";

export interface Chapter {
  id: string;
  kind: "chapter";
  /** Big year label, e.g. "1995–2000". */
  year: string;
  /** Short label for the progress axis (null = dot without label). */
  axis: string | null;
  /** Year used as the giant background type. */
  ghost: T;
  /** CMS TimelineEvent.yearLabel this chapter corresponds to (for real photos). */
  cmsYear?: string;
  /** Archive-era chapters never show photographs (no period photos exist). */
  archive?: boolean;
  concept: T;
  title: T;
  place: T;
  text: T;
  /** Optional line set larger than the body copy. */
  pull?: T;
  visual: ChapterVisual;
  geo: ChapterGeo;
  /** Relative scroll length — sets the rhythm (intimate → acceleration → scale). */
  weight: number;
}

export interface Interlude {
  id: "intro" | "break" | "outro";
  kind: "interlude";
  weight: number;
}

export type StoryBeat = Chapter | Interlude;

export const STORY_COPY = {
  how: { en: "How?", pt: "Como?" },
  thesis: {
    en: ["From Minas", "to the", "World."],
    pt: ["De Minas", "para o", "Mundo."],
  },
  outro: {
    en: ["The stages changed.", "The scale changed.", "The music never stopped."],
    pt: ["Os palcos mudaram.", "A escala mudou.", "A música nunca parou."],
  },
  chapter: { en: "Chapter", pt: "Capítulo" },
  today: { en: "Today", pt: "Hoje" },
  live: { en: "Live", pt: "Ao vivo" },
} as const;

export const CHAPTERS: Chapter[] = [
  {
    id: "origin",
    kind: "chapter",
    year: "1993",
    axis: "1993",
    ghost: { en: "1993", pt: "1993" },
    cmsYear: "1993",
    archive: true,
    concept: { en: "Origin", pt: "Origem" },
    title: { en: "Where it all began", pt: "Onde tudo começou" },
    place: { en: "Alfenas, Minas Gerais", pt: "Alfenas, Minas Gerais" },
    text: {
      pt: "Aos 15 anos, Alan Saher começou a trabalhar na Microtenas, em Alfenas. Entre discos, música e as novidades que chegavam à loja, seu gosto musical começou a tomar forma — e ali nasceu o interesse que mudaria sua trajetória: ser DJ.",
      en: "At 15, Alan Saher began working at Microtenas in Alfenas. Surrounded by records, music and new sounds, his musical identity began to take shape — and so did the passion that would define his journey: becoming a DJ.",
    },
    visual: "record",
    geo: { view: "alfenas", labels: ["alfenas"], pulse: "alfenas" },
    weight: 1.15,
  },
  {
    id: "first-floor",
    kind: "chapter",
    year: "1993–1995",
    axis: null,
    ghost: { en: "1995", pt: "1995" },
    archive: true,
    concept: { en: "First stage", pt: "Primeiro palco" },
    title: { en: "The first dance floor", pt: "A primeira pista" },
    place: { en: "Alfenas, Minas Gerais", pt: "Alfenas, Minas Gerais" },
    text: {
      pt: "Da loja para a pista. O trabalho na Microtenas abriu a primeira porta: Alan foi convidado para assumir as noites da Shock Cine. Durante dois anos, começou a transformar repertório, técnica e leitura de público em identidade.",
      en: "From the record store to the dance floor. His work at Microtenas opened the first door: Alan was invited to DJ at Shock Cine, where two years behind the decks began turning musical taste into identity.",
    },
    visual: "record-spin",
    geo: { view: "alfenas", labels: ["alfenas"], pulse: "alfenas" },
    weight: 1.1,
  },
  {
    id: "beyond-alfenas",
    kind: "chapter",
    year: "1995–2000",
    axis: "1995",
    ghost: { en: "1995", pt: "1995" },
    archive: true,
    concept: { en: "Expansion", pt: "Expansão" },
    title: { en: "Beyond Alfenas", pt: "Além de Alfenas" },
    place: { en: "Varginha, Minas Gerais", pt: "Varginha, Minas Gerais" },
    text: {
      pt: "O próximo passo levou Alan para Varginha. Na discoteca Columbia, permaneceu por cinco anos e ampliou seu nome para além de Alfenas. Era o início de uma carreira que começava a atravessar cidades antes de atravessar países.",
      en: "The next chapter took Alan to Varginha. During five years at Columbia, his name began to travel beyond Alfenas. Long before crossing countries, the journey was already crossing cities.",
    },
    visual: "map",
    geo: { view: "alfenas", route: ["alfenas", "varginha"], labels: ["alfenas", "varginha"] },
    weight: 1.05,
  },
  {
    id: "southern-minas",
    kind: "chapter",
    year: "1998",
    axis: "1998",
    ghost: { en: "1998", pt: "1998" },
    cmsYear: "1998",
    archive: true,
    concept: { en: "Recognition", pt: "Reconhecimento" },
    title: { en: "A name across Southern Minas", pt: "Um nome pelo Sul de Minas" },
    place: { en: "Southern Minas → São Paulo", pt: "Sul de Minas → São Paulo" },
    text: {
      pt: "Em 1998 veio um dos primeiros grandes reconhecimentos. Em um concurso promovido pela Rádio Atenas FM, Alan conquistou o primeiro lugar e o título de “Melhor DJ do Sul de Minas”. A conquista abriu caminho para uma apresentação no Moinho Santo Antônio, em São Paulo, e para a divulgação de seu trabalho na revista DJ Sound.",
      en: "In 1998 came one of his first major recognitions. Alan took first place in a DJ competition promoted by Rádio Atenas FM, earning the title of “Best DJ in Southern Minas.” The achievement led to a performance at Moinho Santo Antônio in São Paulo and exposure in DJ Sound magazine.",
    },
    visual: "map",
    geo: { view: "southeast", route: ["alfenas", "saoPaulo"], labels: ["alfenas", "saoPaulo"] },
    weight: 1.05,
  },
  {
    id: "on-the-road",
    kind: "chapter",
    year: "2000–2008",
    axis: "2000",
    ghost: { en: "2000", pt: "2000" },
    archive: true,
    concept: { en: "The road", pt: "A estrada" },
    title: { en: "On the road", pt: "Na estrada" },
    place: { en: "Brazil", pt: "Brasil" },
    text: {
      pt: "Vieram novas pistas, novas cidades e uma carreira cada vez mais construída na estrada. Alan passou por casas como Contra Mão, Armazém Cervejaria e Over Night. Entre 2002 e 2008, ampliou sua atuação em festas temáticas realizadas em diferentes regiões do Brasil.",
      en: "New clubs, new cities and a career increasingly built on the road followed. Alan performed at venues including Contra Mão, Armazém Cervejaria and Over Night, before expanding into themed events across Brazil between 2002 and 2008.",
    },
    visual: "map",
    geo: { view: "brazil", rings: true },
    weight: 0.85,
  },
  {
    id: "bigger-crowds",
    kind: "chapter",
    year: "2008",
    axis: "2008",
    ghost: { en: "2008", pt: "2008" },
    archive: true,
    concept: { en: "Scale", pt: "Escala" },
    title: { en: "Bigger crowds", pt: "Públicos maiores" },
    place: { en: "Pouso Alegre, Minas Gerais", pt: "Pouso Alegre, Minas Gerais" },
    text: {
      pt: "Em 2008, Alan chegou à tradicional Festa à Fantasia de Pouso Alegre, participando de duas edições.",
      en: "In 2008, Alan joined the traditional Festa à Fantasia in Pouso Alegre for two editions.",
    },
    pull: {
      pt: "Os palcos cresciam. O público também.",
      en: "The stages were getting bigger. So were the crowds.",
    },
    visual: "scale",
    geo: { view: "minas", labels: ["pousoAlegre"], pulse: "pousoAlegre" },
    weight: 0.8,
  },
  {
    id: "back-to-roots",
    kind: "chapter",
    year: "2012",
    axis: "2012",
    ghost: { en: "2012", pt: "2012" },
    concept: { en: "Return", pt: "Retorno" },
    title: { en: "Back to the roots", pt: "De volta às raízes" },
    place: { en: "Alfenas, Minas Gerais", pt: "Alfenas, Minas Gerais" },
    text: {
      pt: "Depois de anos de estrada, Alan voltou a Alfenas em 2012. O retorno às raízes marcou um novo capítulo: apresentações em casas da cidade e o início de sua história com a Federal Fantasy.",
      en: "After years on the road, Alan returned to Alfenas in 2012. Coming back to his roots opened a new chapter — local stages, renewed momentum and the beginning of his story with Federal Fantasy.",
    },
    visual: "map",
    geo: { view: ["brazil", "minas", "alfenas"], labels: ["alfenas"], pulse: "alfenas" },
    weight: 0.95,
  },
  {
    id: "federal-fantasy",
    kind: "chapter",
    year: "2012–2019",
    axis: null,
    ghost: { en: "2012", pt: "2012" },
    cmsYear: "2012–2019",
    concept: { en: "Consolidation", pt: "Consolidação" },
    title: { en: "Federal Fantasy", pt: "Federal Fantasy" },
    place: { en: "Alfenas, Minas Gerais", pt: "Alfenas, Minas Gerais" },
    text: {
      pt: "A Federal Fantasy se tornou parte importante dessa nova fase. Alan participou da organização e se apresentou no evento por sete anos consecutivos, consolidando ainda mais sua presença no cenário mineiro.",
      en: "Federal Fantasy became a defining part of this new era. Alan joined the event's organization and performed for seven consecutive years, strengthening his presence across the Minas Gerais music scene.",
    },
    visual: "map",
    geo: { view: "minas", labels: ["alfenas"], pulse: "alfenas" },
    weight: 0.95,
  },
  {
    id: "world-cup",
    kind: "chapter",
    year: "2014",
    axis: "2014",
    ghost: { en: "2014", pt: "2014" },
    cmsYear: "2014",
    concept: { en: "World stage", pt: "Palco mundial" },
    title: { en: "The World Cup", pt: "A Copa do Mundo" },
    place: { en: "Mineirão · Belo Horizonte, Brazil", pt: "Mineirão · Belo Horizonte, Brasil" },
    text: {
      pt: "Em 2014, a trajetória ganhou dimensão nacional. Após entrar para a TH Agency, Alan foi convidado a se apresentar como DJ em dois jogos da Copa do Mundo no Mineirão, em Belo Horizonte. Minas agora era palco para o mundo.",
      en: "In 2014, the journey reached a new scale. After joining TH Agency, Alan was invited to perform as a DJ during two World Cup matches at Mineirão in Belo Horizonte. Minas was now a stage for the world.",
    },
    visual: "map",
    geo: { view: "brazil", route: ["alfenas", "bh"], labels: ["bh"], pulse: "bh" },
    weight: 1.25,
  },
  {
    id: "olympics",
    kind: "chapter",
    year: "2016",
    axis: "2016",
    ghost: { en: "2016", pt: "2016" },
    cmsYear: "2016",
    concept: { en: "Global stage", pt: "Palco global" },
    title: { en: "The Olympic stage", pt: "O palco olímpico" },
    place: { en: "Rio de Janeiro, Brazil", pt: "Rio de Janeiro, Brasil" },
    text: {
      pt: "Dois anos depois, um novo palco global: os Jogos Olímpicos do Rio de Janeiro. O caminho iniciado nas pistas de Minas agora fazia parte de um dos maiores eventos esportivos do planeta.",
      en: "Two years later came another global stage: the Rio Olympic Games. A journey that began on the dance floors of Minas was now part of one of the world's biggest sporting events.",
    },
    visual: "map",
    geo: { view: "brazil", route: ["alfenas", "rio"], labels: ["rio"], pulse: "rio" },
    weight: 1.15,
  },
  {
    id: "russia",
    kind: "chapter",
    year: "2018",
    axis: "2018",
    ghost: { en: "2018", pt: "2018" },
    cmsYear: "2018",
    concept: { en: "The world", pt: "O mundo" },
    title: { en: "From Brazil to Russia", pt: "Do Brasil à Rússia" },
    place: { en: "Russia", pt: "Rússia" },
    text: {
      pt: "Em 2018, a trajetória atravessou definitivamente as fronteiras do Brasil. Alan chegou à Rússia durante a Copa do Mundo — transformando em realidade a ideia que define sua história: de Minas para o mundo.",
      en: "In 2018, the journey crossed Brazil's borders. Alan reached Russia during the World Cup — bringing to life the idea that defines his story: from Minas to the world.",
    },
    visual: "map",
    geo: { view: "world", route: ["alfenas", "russia"], labels: ["alfenas", "russia"], pulse: "russia" },
    weight: 1.5,
  },
  {
    id: "copa-america",
    kind: "chapter",
    year: "2019",
    axis: "2019",
    ghost: { en: "2019", pt: "2019" },
    cmsYear: "2019",
    concept: { en: "World → roots", pt: "Mundo → raízes" },
    title: { en: "Another international stage", pt: "Outro grande palco" },
    place: { en: "Brazil · Alfenas", pt: "Brasil · Alfenas" },
    text: {
      pt: "Em 2019, mais um grande evento entrou para a trajetória: a abertura da Copa América no Brasil. No mesmo ano, Alan voltou às suas raízes para participar da celebração dos 150 anos de Alfenas diante de milhares de pessoas.",
      en: "In 2019, another major event became part of the journey: the opening of Copa América in Brazil. That same year, Alan returned to his roots to perform during Alfenas' 150th anniversary celebrations before thousands of people.",
    },
    visual: "map",
    geo: { view: ["world", "minas"], labels: ["alfenas"], pulse: "alfenas" },
    weight: 1.1,
  },
  {
    id: "digital",
    kind: "chapter",
    year: "2020",
    axis: "2020",
    ghost: { en: "2020", pt: "2020" },
    concept: { en: "Digital", pt: "Digital" },
    title: { en: "When the stage went digital", pt: "Quando o palco se tornou digital" },
    place: { en: "Online", pt: "Online" },
    text: {
      pt: "Quando os palcos pararam, a música encontrou outro caminho. Em 2020, Alan participou da Live dos Passinhos 80/90, levando sua presença para o ambiente digital e alcançando uma audiência de milhões.",
      en: "When the stages stopped, the music found another way. In 2020, Alan joined the Passinhos 80/90 livestream, taking his presence into the digital world and reaching an audience in the millions.",
    },
    visual: "signal",
    geo: { view: "world" },
    weight: 1.05,
  },
  {
    id: "today",
    kind: "chapter",
    year: "Today",
    axis: "Today",
    ghost: { en: "Now", pt: "Hoje" },
    cmsYear: "2026",
    concept: { en: "Today", pt: "Hoje" },
    title: { en: "The story keeps playing", pt: "A história continua" },
    place: { en: "From Minas to the world", pt: "De Minas para o mundo" },
    text: {
      pt: "Mais de três décadas depois do primeiro contato com as pistas, a essência permanece a mesma: entender o público, criar energia e transformar cada apresentação em uma experiência. Os palcos mudaram. A escala mudou. A música nunca parou.",
      en: "More than three decades after his first steps behind the decks, the essence remains the same: read the crowd, build the energy and turn every performance into an experience. The stages changed. The scale changed. The music never stopped.",
    },
    visual: "photo",
    geo: { view: "world" },
    weight: 1.1,
  },
];

/** Full beat sequence: thesis question → chapters → the break → grand scale → outro. */
export function buildBeats(chapters: Chapter[]): StoryBeat[] {
  const breakAt = chapters.findIndex((c) => c.id === "world-cup");
  const beats: StoryBeat[] = [{ id: "intro", kind: "interlude", weight: 0.9 }];
  chapters.forEach((chapter, i) => {
    if (i === breakAt) beats.push({ id: "break", kind: "interlude", weight: 1.9 });
    beats.push(chapter);
  });
  beats.push({ id: "outro", kind: "interlude", weight: 1.7 });
  return beats;
}
