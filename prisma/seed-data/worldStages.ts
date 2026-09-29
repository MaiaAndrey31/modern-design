import type { WorldStage } from "@/types/content";

/**
 * The largest stages of Alan Saher's career — used by the World Stages section.
 * Framed around scale (the size of the event, not the personal story already
 * told in the Story/timeline section) to avoid repeating the same copy twice.
 * Each entry is designed to occupy close to a full viewport. Replace the
 * image paths with official photography/footage before launch.
 */
export const worldStages: WorldStage[] = [
  {
    year: "2014",
    title: "World Cup",
    location: "Brazil — Mineirão",
    description: "One of the world's biggest sporting stages — the FIFA World Cup, on home ground in Brazil.",
    image: "/images/placeholder-stage.png",
  },
  {
    year: "2016",
    title: "Olympic Games",
    location: "Rio de Janeiro",
    description: "The Olympic Games in Rio de Janeiro — a global audience, once every four years.",
    image: "/images/placeholder-stage.png",
  },
  {
    year: "2018",
    title: "World Cup",
    location: "Russia",
    description: "Back on football's biggest stage for the FIFA World Cup, this time in Russia.",
    image: "/images/placeholder-stage.png",
  },
  {
    year: "2019",
    title: "Copa América",
    location: "South America",
    description: "Copa América — South America's premier continental championship.",
    image: "/images/placeholder-stage.png",
  },
];
