import type { Locale } from "@/lib/i18n/locale";

export type { Locale };

/** Display order of the language switch (EN / PT). The canonical list is LOCALES in src/lib/i18n/locale.ts. */
export const LOCALES: Locale[] = ["en", "pt"];

/**
 * Interface strings (labels, buttons, empty states) — owned by the front-end,
 * never by the CMS. `en` is the source of truth and the SSR default, so the
 * server-rendered HTML (and everything SEO sees) is unchanged.
 */
const en = {
  skipToContent: "Skip to content",
  nav: { story: "Story", music: "Music", shows: "Shows", gallery: "Gallery", booking: "Booking" },
  menu: { open: "Open menu", close: "Close menu" },
  language: "Language",
  loading: "Loading",
  scroll: "Scroll",
  origin: "Sul de Minas — Brazil",
  since: "Since",
  years: "Years",
  worldStages: "World Stages",
  storyProgress: "Chapter",
  music: { eyebrow: "Music", heading: "Listen.", empty: "Releases are on their way here. In the meantime, follow Alan Saher on streaming platforms.", comingSoon: "coming soon", listen: "Listen" },
  gallery: { eyebrow: "Gallery", heading: "Frames from the road.", view: "View", close: "Close", prev: "Previous image", next: "Next image", spin: "Scroll to turn the reel", open: "View photo" },
  press: { eyebrow: "Press", heading: "Selected stories.", empty: "Press coverage will be featured here as it is published.", read: "Read" },
  shows: { eyebrow: "Shows", heading: "On the road.", empty: "No dates announced right now — the agenda is updated as new shows are confirmed.", bookCta: "Book Alan for your event", tickets: "Tickets", soldOut: "Sold out" },
  booking: {
    paused: "Booking requests are temporarily paused. Please check back soon.",
    sendAnother: "Send another request",
    error: "Something went wrong sending your request. Please try again.",
    sending: "Sending…",
    submit: "Request Booking",
    fields: { name: "Name", company: "Company", whatsapp: "WhatsApp", email: "Email", city: "City", eventType: "Event type", eventDate: "Event date", message: "Message" },
  },
  footer: { rights: "All rights reserved.", backToTop: "Back to top", booking: "Booking" },
  cursor: { view: "View", open: "Open", play: "Play", drag: "Drag", go: "Go" },
  newTab: "(opens in a new tab)",
};

export type Dictionary = typeof en;

const pt: Dictionary = {
  skipToContent: "Pular para o conteúdo",
  nav: { story: "História", music: "Música", shows: "Agenda", gallery: "Galeria", booking: "Contratação" },
  menu: { open: "Abrir menu", close: "Fechar menu" },
  language: "Idioma",
  loading: "Carregando",
  scroll: "Role",
  origin: "Sul de Minas — Brasil",
  since: "Desde",
  years: "Anos",
  worldStages: "Palcos pelo mundo",
  storyProgress: "Capítulo",
  music: { eyebrow: "Música", heading: "Ouça.", empty: "Os lançamentos chegam em breve. Enquanto isso, acompanhe Alan Saher nas plataformas de streaming.", comingSoon: "em breve", listen: "Ouvir" },
  gallery: { eyebrow: "Galeria", heading: "Registros da estrada.", view: "Ver", close: "Fechar", prev: "Imagem anterior", next: "Próxima imagem", spin: "Role para girar a bobina", open: "Ver foto" },
  press: { eyebrow: "Imprensa", heading: "Histórias selecionadas.", empty: "A cobertura de imprensa aparecerá aqui conforme for publicada.", read: "Ler" },
  shows: { eyebrow: "Agenda", heading: "Na estrada.", empty: "Nenhuma data anunciada no momento — a agenda é atualizada conforme novos shows são confirmados.", bookCta: "Contrate Alan para o seu evento", tickets: "Ingressos", soldOut: "Esgotado" },
  booking: {
    paused: "As solicitações de contratação estão temporariamente pausadas. Volte em breve.",
    sendAnother: "Enviar outra solicitação",
    error: "Não foi possível enviar sua solicitação. Tente novamente.",
    sending: "Enviando…",
    submit: "Solicitar contratação",
    fields: { name: "Nome", company: "Empresa", whatsapp: "WhatsApp", email: "E-mail", city: "Cidade", eventType: "Tipo de evento", eventDate: "Data do evento", message: "Mensagem" },
  },
  footer: { rights: "Todos os direitos reservados.", backToTop: "Voltar ao topo", booking: "Contratação" },
  cursor: { view: "Ver", open: "Abrir", play: "Ouvir", drag: "Arraste", go: "Ir" },
  newTab: "(abre em nova aba)",
};

export const dictionaries: Record<Locale, Dictionary> = { en, pt };

/**
 * Portuguese renderings of CMS copy. The CMS stores a single (English)
 * version and must not be changed, so known strings are translated on the
 * client by exact match; anything the team edits later that isn't listed
 * here simply shows as written in the CMS — never a broken/empty label.
 */
const contentPt: Record<string, string> = {
  // Hero
  Explore: "Explorar",
  Booking: "Contratação",
  Producer: "Produtor",
  // Statement
  "From Minas": "De Minas",
  "to the": "para o",
  "World.": "Mundo.",
  // Story
  "The Story": "A História",
  "30+ years,": "30+ anos,",
  "one journey.": "uma jornada.",
  "The Beginning": "O Início",
  Recognition: "Reconhecimento",
  "World Cup": "Copa do Mundo",
  "Olympic Games": "Jogos Olímpicos",
  Brazil: "Brasil",
  Russia: "Rússia",
  "The Story Continues": "A História Continua",
  "Alan Saher starts his career in music and entertainment, still young, in Sul de Minas.":
    "Alan Saher inicia sua carreira na música e no entretenimento, ainda jovem, no Sul de Minas.",
  "Recognized in a competition promoted by Rádio Atenas FM, standing out as a leading DJ in the Sul de Minas region.":
    "Reconhecido em um concurso promovido pela Rádio Atenas FM, destacando-se como um dos principais DJs do Sul de Minas.",
  "Years of performances tied to Federal Fantasy, building a reputation across nightclubs and major parties.":
    "Anos de apresentações ligadas à Federal Fantasy, construindo reputação em casas noturnas e grandes festas.",
  "Performances connected to the FIFA World Cup in Brazil, including appearances at the Mineirão.":
    "Apresentações ligadas à Copa do Mundo FIFA no Brasil, incluindo o Mineirão.",
  "Participation tied to the Rio de Janeiro Olympic Games.": "Participação ligada aos Jogos Olímpicos do Rio de Janeiro.",
  "Participation tied to the FIFA World Cup in Russia.": "Participação ligada à Copa do Mundo FIFA na Rússia.",
  "Participation tied to Copa América, plus a performance for the 150th anniversary celebrations of Alfenas.":
    "Participação ligada à Copa América, além de uma apresentação nas comemorações dos 150 anos de Alfenas.",
  "More than three decades in, the sound keeps evolving — new stages, new productions, the same energy.":
    "Mais de três décadas depois, o som segue evoluindo — novos palcos, novas produções, a mesma energia.",
  // World Stages
  "Brazil — Mineirão": "Brasil — Mineirão",
  "South America": "América do Sul",
  "One of the world's biggest sporting stages — the FIFA World Cup, on home ground in Brazil.":
    "Um dos maiores palcos esportivos do mundo — a Copa do Mundo FIFA, em casa, no Brasil.",
  "The Olympic Games in Rio de Janeiro — a global audience, once every four years.":
    "Os Jogos Olímpicos no Rio de Janeiro — uma audiência global, uma vez a cada quatro anos.",
  "Back on football's biggest stage for the FIFA World Cup, this time in Russia.":
    "De volta ao maior palco do futebol na Copa do Mundo FIFA, desta vez na Rússia.",
  "Copa América — South America's premier continental championship.":
    "Copa América — o principal campeonato continental da América do Sul.",
  // Manifesto
  "The stage changes.": "O palco muda.",
  "The crowd changes.": "O público muda.",
  "The country changes.": "O país muda.",
  "The energy doesn't.": "A energia não.",
  // Experience
  "The Experience": "A Experiência",
  "Lights, crowd, energy.": "Luzes, público, energia.",
  "Crowd energy under stage lights": "A energia do público sob as luzes do palco",
  "Alan Saher behind the decks": "Alan Saher nas pick-ups",
  "Backstage moment before a show": "Bastidores antes de um show",
  "Stage lighting rig at full scale": "Estrutura de luz do palco em escala total",
  // Press kit
  "Press Kit": "Press Kit",
  "For promoters & media.": "Para produtores e imprensa.",
  "Downloadable one-sheet, photos and logos — coming soon": "One-sheet, fotos e logos para download — em breve",
  "Alan Saher began his career in 1993. In 1998, he was recognized in a competition promoted by Rádio Atenas FM, which highlighted him as a leading DJ in the Sul de Minas region. Over the following decades he performed across nightclubs, private parties and large-scale events, including a run with Federal Fantasy between 2012 and 2019. His career includes performances tied to the 2014 FIFA World Cup in Brazil (including the Mineirão), the 2016 Rio Olympic Games, the 2018 FIFA World Cup in Russia, and the 2019 Copa América, as well as the 150th anniversary celebrations of Alfenas in 2019. Alan Saher also produces original music released on major digital platforms.":
    "Alan Saher iniciou sua carreira em 1993. Em 1998, foi reconhecido em um concurso promovido pela Rádio Atenas FM, que o destacou como um dos principais DJs do Sul de Minas. Nas décadas seguintes, apresentou-se em casas noturnas, festas privadas e grandes eventos, incluindo uma trajetória com a Federal Fantasy entre 2012 e 2019. Sua carreira inclui apresentações ligadas à Copa do Mundo FIFA de 2014 no Brasil (incluindo o Mineirão), aos Jogos Olímpicos Rio 2016, à Copa do Mundo FIFA de 2018 na Rússia e à Copa América de 2019, além das comemorações dos 150 anos de Alfenas em 2019. Alan Saher também produz música original, lançada nas principais plataformas digitais.",
  // Booking
  "Bring the experience to your event.": "Leve essa experiência para o seu evento.",
  "Festivals, private events, brand activations and more — tell us about your event and the team will get back to you.":
    "Festivais, eventos privados, ativações de marca e muito mais — conte sobre o seu evento e a equipe retornará o contato.",
  "Request received.": "Solicitação recebida.",
  "Thank you — the team will be in touch shortly.": "Obrigado — a equipe entrará em contato em breve.",
  // Booking validation (src/lib/validations/booking.ts)
  "Enter your full name.": "Informe seu nome completo.",
  "Enter a valid WhatsApp number.": "Informe um número de WhatsApp válido.",
  "Use digits only (with country code).": "Use apenas números (com o código do país).",
  "Enter a valid email address.": "Informe um e-mail válido.",
  "Enter the event city.": "Informe a cidade do evento.",
  "Tell us the type of event.": "Informe o tipo de evento.",
  // Footer
  "Built as a digital experience — not a template.": "Construído como uma experiência digital — não um template.",
};

export function translateContent(text: string, locale: Locale): string {
  if (locale === "en") return text;
  return contentPt[text.trim()] ?? text;
}
