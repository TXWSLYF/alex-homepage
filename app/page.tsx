import { HomeBlogTeaser } from "./components/home-blog-teaser";
import { HomeHero } from "./components/home-hero";
import { HomePhotoSpotlight } from "./components/home-photo-spotlight";

export default function Home() {
  return (
    <div className="relative z-1 flex min-h-0 flex-1 flex-col">
      <HomeHero />
      <HomeBlogTeaser />
      <HomePhotoSpotlight />
    </div>
  );
}
