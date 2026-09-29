/**
 * Central artist identity data. Edit here to update copy across the site.
 * Facts below come strictly from the brief provided by the artist team.
 * Anything marked TODO must be confirmed before final publication.
 */

export const artist = {
  name: "Alan Saher",
  roles: ["DJ", "Producer", "Entertainer"] as const,
  startYear: 1993,
  tagline: "30+ Years. One Sound. Thousands of Stories.",
  originStatement: "From Minas to the World.",
  // Associated expression — kept editable, not forced as an official signature.
  signaturePhrase: "Pegada Monstra",
  bioShort:
    "For more than three decades, Alan Saher has taken his sound from the nightclubs of the Sul de Minas to some of the world's biggest stages — carrying the same energy from World Cups to Olympic Games.",
  // TODO: replace with the artist's approved full biography before launch.
  bioFull:
    "Alan Saher began his career in 1993. In 1998, he was recognized in a competition promoted by Rádio Atenas FM, which highlighted him as a leading DJ in the Sul de Minas region. Over the following decades he performed across nightclubs, private parties and large-scale events, including a run with Federal Fantasy between 2012 and 2019. His career includes performances tied to the 2014 FIFA World Cup in Brazil (including the Mineirão), the 2016 Rio Olympic Games, the 2018 FIFA World Cup in Russia, and the 2019 Copa América, as well as the 150th anniversary celebrations of Alfenas in 2019. Alan Saher also produces original music released on major digital platforms.",
} as const;

export type ArtistRole = (typeof artist.roles)[number];
