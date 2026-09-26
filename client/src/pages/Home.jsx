import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import api from "../api/axios";

gsap.registerPlugin(ScrollTrigger);

const fallbackSettings = {
  shopName: "ECLORA",
  logoUrl: "",
  announcementText: "Free delivery on selected orders.",
  hero: {
    eyebrow: "Jewelry for soft power moments",
    title: "Welcome to the world of jewelry.",
    subtitle:
      "Step into ECLORA, where refined pieces glow softly through everyday moments and unforgettable little victories.",
    primaryButtonText: "Shop Now",
    primaryButtonLink: "#products",
    secondaryButtonText: "Explore Story",
    secondaryButtonLink: "#collections",
    slides: [
      {
        imageUrl:
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=90",
        title: "Statement Rings",
        subtitle: "New Drop",
        isActive: true,
        sortOrder: 0,
      },
      {
        imageUrl:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=90",
        title: "Diamond Details",
        subtitle: "Signature Pieces",
        isActive: true,
        sortOrder: 1,
      },
      {
        imageUrl:
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=90",
        title: "Quiet Luxury",
        subtitle: "ECLORA Edit",
        isActive: true,
        sortOrder: 2,
      },
    ],
  },
  about: {
    title: "Every piece begins with a feeling.",
    text: "ECLORA is a modern jewelry store created for soft elegance, meaningful details, and pieces that make everyday moments feel special.",
  },
};

const normalizeLink = (link) => {
  if (!link) return "#";
  if (link.startsWith("/#")) return link.replace("/", "");
  return link;
};

const storyCards = [
  {
    number: "01",
    label: "Feeling",
    text: "Made for the moments you want to remember.",
  },
  {
    number: "02",
    label: "Detail",
    text: "From delicate rings to meaningful necklaces, every piece is chosen to feel personal, elegant, and easy to wear.",
  },
  {
    number: "03",
    label: "Experience",
    text: "A smooth shopping journey, careful packaging, and jewelry made to arrive like a little celebration.",
  },
];

const Home = () => {
  const homeRef = useRef(null);

  const [settings, setSettings] = useState(fallbackSettings);
  const [storyOpen, setStoryOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/site-settings");

        setSettings({
          ...fallbackSettings,
          ...res.data,
          hero: {
            ...fallbackSettings.hero,
            ...res.data.hero,
            slides:
              res.data.hero?.slides?.length > 0
                ? res.data.hero.slides
                : fallbackSettings.hero.slides,
          },
          about: {
            ...fallbackSettings.about,
            ...res.data.about,
          },
        });
      } catch (error) {
        console.log("Could not load site settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const activeSlides = useMemo(() => {
    const slides = settings.hero.slides || [];

    const cleanSlides = slides
      .filter((slide) => slide.imageUrl && slide.isActive !== false)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

    return cleanSlides.length > 0 ? cleanSlides : fallbackSettings.hero.slides;
  }, [settings.hero.slides]);

  const firstSlide = activeSlides[0] || fallbackSettings.hero.slides[0];
  const secondSlide = activeSlides[1] || activeSlides[0];
  const thirdSlide = activeSlides[2] || activeSlides[0];

  const mosaicImages = {
    first: firstSlide?.imageUrl,
    second: secondSlide?.imageUrl || firstSlide?.imageUrl,
    third: thirdSlide?.imageUrl || firstSlide?.imageUrl,
  };

  const handleStoryCardClick = (index) => {
    setActiveStoryIndex(index);
    setStoryOpen(true);
  };

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [settings]);

  useGSAP(
    () => {
      gsap.set(".falling-card", {
        y: -420,
        opacity: 0,
        scale: 0.96,
        rotate: -3,
      });

      gsap.set(".falling-caption", {
        y: 24,
        opacity: 0,
      });

      gsap.from(".hero-copy > *", {
        y: 34,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });

      const introTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero-cinema",
          start: "top top",
          end: "+=1500",
          scrub: 0.85,
          pin: ".hero-cinema",
          pinSpacing: true,
          anticipatePin: 1,
        },
      });

      introTimeline
        .to(
          ".hero-copy",
          {
            y: -180,
            scale: 0.55,
            opacity: 0,
            filter: "blur(12px)",
            ease: "power2.out",
            duration: 0.36,
          },
          0,
        )
        .to(
          ".hero-bg-light",
          {
            opacity: 0.2,
            ease: "power2.out",
            duration: 0.32,
          },
          0,
        )
        .to(
          ".falling-card-one",
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotate: -1,
            ease: "power2.out",
            duration: 0.34,
          },
          0.24,
        )
        .to(
          ".falling-card-two",
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotate: 0,
            ease: "power2.out",
            duration: 0.42,
          },
          0.36,
        )
        .to(
          ".falling-card-three",
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotate: 1,
            ease: "power2.out",
            duration: 0.34,
          },
          0.48,
        )
        .to(
          ".falling-caption",
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            ease: "power2.out",
            duration: 0.26,
          },
          0.64,
        );

      gsap.to(".lux-spark", {
        opacity: 0.95,
        scale: 1.25,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.18,
      });

      gsap.utils.toArray(".story-reveal").forEach((element) => {
        gsap.from(element, {
          y: 38,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
          },
        });
      });

      gsap.from(".story-card-deck", {
        y: 48,
        opacity: 0,
        scale: 0.96,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".story-card-deck",
          start: "top 86%",
        },
      });
    },
    {
      scope: homeRef,
      dependencies: [settings.hero.title, activeSlides.length],
      revertOnUpdate: true,
    },
  );

  return (
    <main
      id="home"
      ref={homeRef}
      className="overflow-hidden bg-[#050505] text-white"
    >
      <section className="hero-cinema relative h-screen min-h-[720px] w-full overflow-hidden bg-[#050505]">
        <div className="hero-bg-light pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(255,255,255,0.15),transparent_28%),radial-gradient(circle_at_78%_22%,rgba(198,167,125,0.13),transparent_25%),linear-gradient(135deg,#050505_0%,#111111_48%,#050505_100%)]" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.22)_48%,rgba(0,0,0,0.82)_100%)]" />

        <span className="lux-spark absolute left-[13%] top-[31%] h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_22px_rgba(255,255,255,0.9)]" />
        <span className="lux-spark absolute right-[22%] top-[25%] h-1 w-1 rounded-full bg-[#d8c2a2]" />
        <span className="lux-spark absolute bottom-[26%] left-[50%] h-1 w-1 rounded-full bg-white/60" />

        <div className="hero-copy absolute inset-0 z-20 grid place-items-center px-6 pt-16 text-center">
          <div className="max-w-6xl">
            <p className="mx-auto flex w-fit items-center gap-3 text-xs uppercase tracking-[0.35em] text-[#d7c0a0]">
              <Sparkles size={15} />
              {settings.hero.eyebrow || "Jewelry for soft power moments"}
            </p>

            <h1 className="mt-6 font-serif text-[clamp(3.2rem,7.4vw,8rem)] uppercase leading-[0.88] tracking-[-0.075em] text-white">
              {settings.hero.title || "Welcome to the world of jewelry."}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/58 md:text-lg">
              {settings.hero.subtitle}
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <a
                href={normalizeLink(settings.hero.primaryButtonLink)}
                className="group inline-flex items-center gap-4 rounded-full bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-black transition hover:scale-105"
              >
                {settings.hero.primaryButtonText || "Shop Now"}
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </a>

              <a
                href={normalizeLink(settings.hero.secondaryButtonLink)}
                className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/75 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
              >
                {settings.hero.secondaryButtonText || "Explore Story"}
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center px-5 pt-20 md:px-10">
          <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-[0.82fr_1.15fr_0.82fr]">
            <article className="falling-card falling-card-one group relative hidden h-[54vh] max-h-[500px] min-h-[360px] overflow-hidden rounded-[1.7rem] bg-white/5 md:block">
              <img
                src={mosaicImages.first}
                alt="ECLORA necklace"
                className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

              <div className="falling-caption absolute bottom-6 left-6 right-6">
                <p className="text-xs uppercase tracking-[0.32em] text-[#d8c2a2]">
                  Necklaces
                </p>

                <h3 className="mt-2 font-serif text-3xl leading-tight">
                  Made to feel personal.
                </h3>
              </div>
            </article>

            <article className="falling-card falling-card-two group relative h-[62vh] max-h-[610px] min-h-[430px] overflow-hidden rounded-[1.9rem] bg-white/5">
              <img
                src={mosaicImages.second}
                alt="ECLORA ring"
                className="h-full w-full object-cover opacity-95 transition duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/10 to-transparent" />

              <div className="falling-caption absolute bottom-7 left-7 right-7">
                <p className="text-xs uppercase tracking-[0.32em] text-[#d8c2a2]">
                  Statement piece
                </p>

                <h3 className="max-w-md font-serif text-4xl leading-tight md:text-5xl">
                  Elegant details that glow in silence.
                </h3>
              </div>
            </article>

            <article className="falling-card falling-card-three group relative hidden h-[54vh] max-h-[500px] min-h-[360px] overflow-hidden rounded-[1.7rem] bg-white/5 md:block">
              <img
                src={mosaicImages.third}
                alt="ECLORA diamond detail"
                className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

              <div className="falling-caption absolute bottom-6 left-6 right-6">
                <p className="text-xs uppercase tracking-[0.32em] text-[#d8c2a2]">
                  Diamonds
                </p>

                <h3 className="mt-2 font-serif text-3xl leading-tight">
                  Shine without shouting.
                </h3>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        id="collections"
        className="brand-story relative overflow-hidden bg-[#050505] px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
      >
        <span id="about" className="absolute -top-24" aria-hidden="true" />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_80%_35%,rgba(199,173,134,0.1),transparent_26%)]" />

        <div className="relative mx-auto max-w-[1500px]">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="story-reveal">
              <p className="flex items-center gap-3 text-xs uppercase tracking-[0.38em] text-[#c7ad86]">
                <Sparkles size={15} />
                The ECLORA story
              </p>

              <h2 className="mt-6 max-w-3xl font-serif text-[clamp(3rem,5vw,5.8rem)] leading-[0.92] tracking-[-0.065em] text-white">
                {settings.about.title || "Every piece begins with a feeling."}
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-white/58 md:text-lg">
                {settings.about.text}
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a
                  href="#products"
                  className="group inline-flex items-center gap-4 rounded-full bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-black transition hover:scale-105"
                >
                  Discover pieces
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </a>

                <button
                  type="button"
                  onClick={() => setStoryOpen((prev) => !prev)}
                  className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
                >
                  {storyOpen ? "Gather story" : "Open story"}
                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </button>
              </div>
            </div>

            <div className="story-reveal relative overflow-hidden rounded-[2.2rem] bg-white/[0.04] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              <div className="relative h-[500px] overflow-hidden md:h-[620px]">
                <img
                  src={mosaicImages.second}
                  alt="ECLORA brand story"
                  className="h-full w-full object-cover opacity-90"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />

                <div className="absolute bottom-8 left-7 right-7 md:left-9 md:right-9">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#d8c2a2]">
                    Quiet luxury
                  </p>

                  <h3 className="mt-3 max-w-2xl font-serif text-[clamp(2.3rem,3.6vw,4.4rem)] leading-[0.96] tracking-[-0.055em] text-white">
                    Not loud. Not excessive. Just yours.
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`story-card-deck mt-14 ${
              storyOpen
                ? "grid gap-5 lg:grid-cols-3"
                : "relative mx-auto h-[430px] max-w-3xl lg:h-[360px]"
            }`}
          >
            {storyCards.map((card, index) => {
              const isActive = activeStoryIndex === index;

              const closedPosition = [
                "left-1/2 top-0 -translate-x-1/2 rotate-[-4deg]",
                "left-1/2 top-7 -translate-x-1/2 rotate-[0deg]",
                "left-1/2 top-14 -translate-x-1/2 rotate-[4deg]",
              ][index];

              return (
                <button
                  key={card.number}
                  type="button"
                  onClick={() => handleStoryCardClick(index)}
                  className={`group text-left transition-all duration-700 ease-out ${
                    storyOpen
                      ? "relative min-h-[290px] w-full translate-x-0 rotate-0"
                      : `absolute h-[300px] w-[min(92vw,680px)] ${closedPosition}`
                  } ${
                    storyOpen && isActive
                      ? "scale-[1.02]"
                      : storyOpen
                        ? "scale-100"
                        : "hover:scale-[1.02]"
                  }`}
                  style={{
                    zIndex: storyOpen ? (isActive ? 20 : 10) : 30 - index,
                  }}
                >
                  <div
                    className={`flex h-full flex-col justify-between rounded-[1.9rem] border p-7 backdrop-blur-xl transition-all duration-700 md:p-8 ${
                      isActive
                        ? "border-[#c7ad86]/45 bg-[#1a1713]/88 shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
                        : "border-white/10 bg-white/[0.045] shadow-[0_18px_55px_rgba(0,0,0,0.28)]"
                    }`}
                  >
                    <div>
                      <p className="font-sans text-xs font-semibold uppercase tracking-[0.36em] text-[#c7ad86]">
                        {card.number} · {card.label}
                      </p>

                      <p className="mt-7 font-sans text-[clamp(1.55rem,2.4vw,2.5rem)] font-medium leading-[1.28] tracking-[-0.03em] text-white/82">
                        {card.text}
                      </p>
                    </div>

                    <div className="mt-8">
                      <span className="font-sans text-xs uppercase tracking-[0.26em] text-white/35">
                        {storyOpen ? "Click to focus" : "Click to unfold"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
