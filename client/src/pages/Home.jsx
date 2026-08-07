import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import api from "../api/axios";

const fallbackSettings = {
  shopName: "ECLORA",
  logoUrl: "",
  announcementText: "Free delivery on selected orders.",
  hero: {
    eyebrow: "Fine Jewelry",
    title: "Jewelry that whispers luxury.",
    subtitle:
      "Discover elegant rings, necklaces and bracelets designed for a soft, timeless glow.",
    primaryButtonText: "Shop Now",
    primaryButtonLink: "#products",
    secondaryButtonText: "Explore",
    secondaryButtonLink: "#collections",
    slides: [
      {
        imageUrl:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338",
        title: "Golden Essentials",
        subtitle: "New Drop",
        isActive: true,
        sortOrder: 0,
      },
    ],
  },
  about: {
    title: "About ECLORA",
    text: "ECLORA is a modern jewelry store focused on elegant, wearable pieces with a premium shopping experience.",
  },
  contact: {
    phone: "",
    email: "",
    address: "",
    whatsapp: "",
  },
  socials: {
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: "",
  },
  footerText: "© ECLORA. All rights reserved.",
};

const normalizeLink = (link) => {
  if (!link) return "#";

  if (link.startsWith("/#")) {
    return link.replace("/", "");
  }

  return link;
};

const Home = () => {
  const heroRef = useRef(null);

  const [settings, setSettings] = useState(fallbackSettings);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useGSAP(
    () => {
      gsap.from(".hero-text", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      gsap.from(".hero-image", {
        scale: 0.92,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
      });
    },
    { scope: heroRef },
  );

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
          contact: {
            ...fallbackSettings.contact,
            ...res.data.contact,
          },
          socials: {
            ...fallbackSettings.socials,
            ...res.data.socials,
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

  const currentSlide = activeSlides[currentSlideIndex] || activeSlides[0];

  useEffect(() => {
    if (activeSlides.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentSlideIndex((prevIndex) =>
        prevIndex + 1 >= activeSlides.length ? 0 : prevIndex + 1,
      );
    }, 10000);

    return () => clearInterval(intervalId);
  }, [activeSlides.length]);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [activeSlides.length]);

  useEffect(() => {
    gsap.fromTo(
      ".hero-slide-image",
      {
        opacity: 0,
        scale: 1.04,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
      },
    );
  }, [currentSlideIndex]);

  return (
    <main id="home" ref={heroRef} className="overflow-x-hidden bg-[#faf7f2]">
      {settings.announcementText && (
        <section className="border-b border-stone-200 bg-stone-950 px-6 py-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">
            {settings.announcementText}
          </p>
        </section>
      )}

      <section className="mx-auto grid min-h-[55vh] max-w-7xl items-center gap-8 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="hero-text text-sm uppercase tracking-[0.5em] text-stone-400">
            {settings.hero.eyebrow}
          </p>

          <h1 className="hero-text mt-4 max-w-lg text-4xl font-extrabold leading-tight text-stone-950 md:text-5xl">
            {settings.hero.title}
          </h1>

          <p className="hero-text mt-4 max-w-md text-base leading-7 text-stone-600">
            {settings.hero.subtitle}
          </p>

          <div className="hero-text mt-8 flex flex-wrap items-center gap-4">
            <a
              href={normalizeLink(settings.hero.primaryButtonLink)}
              className="inline-flex items-center gap-3 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700"
            >
              {settings.hero.primaryButtonText || "Shop Now"}
              <ArrowRight size={18} />
            </a>

            <a
              href={normalizeLink(settings.hero.secondaryButtonLink)}
              className="rounded-full border border-stone-300 px-6 py-3 text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
            >
              {settings.hero.secondaryButtonText || "Explore"}
            </a>
          </div>
        </div>

        <div className="hero-image relative">
          <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
            <img
              key={currentSlide?.imageUrl}
              src={currentSlide?.imageUrl}
              alt={currentSlide?.title || "Luxury jewelry"}
              className="hero-slide-image h-[300px] w-full object-cover md:h-[340px]"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          </div>

          <div className="absolute bottom-5 left-5 max-w-[80%] rounded-2xl bg-white/85 p-4 shadow-lg backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
              {currentSlide?.subtitle || "New Drop"}
            </p>

            <p className="mt-1 text-lg font-semibold text-stone-900">
              {currentSlide?.title || "Golden Essentials"}
            </p>
          </div>

          {activeSlides.length > 1 && (
            <div className="absolute bottom-5 right-5 flex gap-2 rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-md">
              {activeSlides.map((slide, index) => (
                <button
                  key={`${slide.imageUrl}-${index}`}
                  type="button"
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === currentSlideIndex
                      ? "w-8 bg-stone-950"
                      : "w-2.5 bg-stone-300 hover:bg-stone-500"
                  }`}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-7xl px-6 pb-20 pt-14">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="group rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
              Rings
            </p>

            <h3 className="mt-3 text-2xl font-bold text-stone-900">
              Minimal sparkle
            </h3>
          </div>

          <div className="group rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
              Necklaces
            </p>

            <h3 className="mt-3 text-2xl font-bold text-stone-900">
              Soft elegance
            </h3>
          </div>

          <div className="group rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
              Bracelets
            </p>

            <h3 className="mt-3 text-2xl font-bold text-stone-900">
              Everyday glow
            </h3>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              About
            </p>

            <h2 className="mt-4 text-4xl font-bold text-stone-950">
              {settings.about.title}
            </h2>
          </div>

          <div>
            <p className="max-w-3xl text-lg leading-8 text-stone-600">
              {settings.about.text}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {settings.contact.phone && (
                <div className="rounded-3xl bg-stone-50 p-5">
                  <Phone size={19} className="text-stone-950" />

                  <p className="mt-3 text-sm text-stone-500">Phone</p>

                  <p className="mt-1 font-semibold text-stone-950">
                    {settings.contact.phone}
                  </p>
                </div>
              )}

              {settings.contact.email && (
                <div className="rounded-3xl bg-stone-50 p-5">
                  <Mail size={19} className="text-stone-950" />

                  <p className="mt-3 text-sm text-stone-500">Email</p>

                  <p className="mt-1 break-all font-semibold text-stone-950">
                    {settings.contact.email}
                  </p>
                </div>
              )}

              {settings.contact.address && (
                <div className="rounded-3xl bg-stone-50 p-5">
                  <MapPin size={19} className="text-stone-950" />

                  <p className="mt-3 text-sm text-stone-500">Address</p>

                  <p className="mt-1 font-semibold text-stone-950">
                    {settings.contact.address}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {settings.socials.instagram && (
                <a
                  href={settings.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-stone-200 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
                >
                  Instagram
                </a>
              )}

              {settings.socials.facebook && (
                <a
                  href={settings.socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-stone-200 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
                >
                  Facebook
                </a>
              )}

              {settings.socials.tiktok && (
                <a
                  href={settings.socials.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-stone-200 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
                >
                  TikTok
                </a>
              )}

              {settings.socials.linkedin && (
                <a
                  href={settings.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-stone-200 px-5 py-2 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
