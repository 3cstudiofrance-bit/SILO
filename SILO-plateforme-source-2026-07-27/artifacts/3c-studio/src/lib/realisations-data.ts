export type Realisation = {
  id: number;
  title: string;
  category: "clip" | "gospel";
  client: string;
  year?: number;
  description?: string;
  tags: string[];
  videoUrl: string;
  thumbnail: string;
};

const yt = (videoId: string, id: number, title: string, client: string, category: Realisation["category"], tags: string[]): Realisation => ({
  id,
  title,
  client,
  category,
  tags,
  videoUrl: `https://www.youtube.com/watch?v=${videoId}&list=PLLZsn5CQ2KcGgqeqsg4hX7i7gkfPAW9z4`,
  thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
});

export const realisations: Realisation[] = [
  yt("jA4qwY00X_g", 1, "KingdomCome : Souviens-Toi (Cover Remember by Sinach)", "KingdomCome feat Diana Mutombo & Joy Jean", "gospel", ["Gospel", "Cover"]),
  yt("O9daOFbgCRM", 2, "Jésus Règne (Clip officiel)", "Esther Maryse", "gospel", ["Gospel", "Clip officiel"]),
  yt("ynnLMXT3xxU", 3, "Loin", "KSR", "clip", ["Rap", "Clip officiel"]),
  yt("3raoPThyrg4", 4, "Paquinou feat Observateur Ebène (Clip officiel)", "Tripa Gninnin", "clip", ["Afro", "Clip officiel"]),
  yt("NXd1fL0A0qU", 5, "Body Ride", "Royalty x Lewismelo", "clip", ["Afro", "Clip"]),
  yt("L9pec4k8pAM", 6, "Suavemente Remix (Clip officiel)", "Melenvrai", "clip", ["Remix", "Clip officiel"]),
  yt("DCR236ZN_eg", 7, "Paris 13", "Aousse 6Z", "clip", ["Rap", "Clip"]),
  yt("Em_GwuBC9jQ", 8, "An Pé Pa (Clip officiel)", "Skily x Ledyl", "clip", ["Clip officiel"]),
  yt("lKynx7te5vw", 9, "Deep", "LA 2Z", "clip", ["Rap", "Clip"]),
  yt("5ft5aBYvAaU", 10, "Meilleur freestyle 1", "Aousse 6z", "clip", ["Freestyle"]),
  yt("FMFcqHBqOlE", 11, "Trop Réel (Clip officiel)", "Melenvrai", "clip", ["Rap", "Clip officiel"]),
  yt("0NcZcKLpw4Q", 12, "Reste (Stay — William McDowell)", "Joy Ministries", "gospel", ["Gospel", "Cover"]),
  yt("J97n1ifsTfw", 13, "Dieu Agit (Clip officiel)", "Esther Maryse", "gospel", ["Gospel", "Clip officiel"]),
  yt("C4Ro003Xx5M", 14, "Système", "Tripa Gninnin", "clip", ["Afro", "Clip"]),
  yt("M0KVSRHjWN4", 15, "Dans l'eau (Freestyle Gninnin 3)", "Tripa Gninnin", "clip", ["Freestyle", "Clip officiel"]),
  yt("X0OeoOqwT3M", 16, "Pourquoi Tu Gnan feat Latop (Clip officiel)", "Tripa Gninnin", "clip", ["Afro", "Clip officiel"]),
  yt("DjM1GVoa5E8", 17, "C 1 Jeu", "Tripa Gninnin", "clip", ["Afro", "Clip"]),
  yt("ZZujyPNmI74", 18, "Je Te Fais Confiance (Clip officiel)", "Prudel Bouks", "gospel", ["Gospel", "Clip officiel"]),
  yt("9chUNcxCQiA", 19, "Je Te Fais Confiance (Clip officiel)", "Ophelia Cinthia", "gospel", ["Gospel", "Clip officiel"]),
  yt("HuaL7653oSQ", 20, "Billet Violet (Clip officiel)", "Kage", "clip", ["Rap", "Clip officiel"]),
  yt("twt2VaQcCfM", 21, "Kageinnove ! (Clip officiel)", "Kage", "clip", ["Rap", "Clip officiel"]),
  yt("Q2YbQXLqobc", 22, "Il Est Né [Remix] (Clip officiel)", "Marlène", "gospel", ["Gospel", "Remix"]),
  yt("BanP73ESzhI", 23, "10 années — Music video clip", "6z", "clip", ["Rap", "Clip"]),
  yt("glnlrAT94kk", 24, "Pour Lyly (Clip officiel)", "Zorro CSL", "clip", ["Clip officiel"]),
  yt("6S2kpOXMayo", 25, "Kelentai (Clip officiel)", "Abescar", "clip", ["Afro", "Clip officiel"]),
];

export const categoryLabels: Record<Realisation["category"], string> = {
  clip: "Clip artiste",
  gospel: "Gospel",
};

export const categoryColors: Record<Realisation["category"], string> = {
  clip: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
  gospel: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
};

export const PLAYLIST_URL = "https://youtube.com/playlist?list=PLLZsn5CQ2KcGgqeqsg4hX7i7gkfPAW9z4";

export const REALISATEUR = "Saïd Fofana";
