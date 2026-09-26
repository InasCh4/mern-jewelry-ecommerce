import { useEffect, useState } from "react";
import { ExternalLink, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import api from "../api/axios";

const fallbackSettings = {
  shopName: "ECLORA",
  footerText: "© ECLORA. All rights reserved.",
  contact: {
    phone: "",
    email: "",
    address: "",
  },
  socials: {
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: "",
  },
};

const Footer = () => {
  const [settings, setSettings] = useState(fallbackSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/site-settings");

        setSettings({
          ...fallbackSettings,
          ...res.data,
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
        console.log("Could not load footer settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const socialLinks = [
    {
      label: "Instagram",
      url: settings.socials.instagram,
    },
    {
      label: "Facebook",
      url: settings.socials.facebook,
    },
    {
      label: "TikTok",
      url: settings.socials.tiktok,
    },
    {
      label: "LinkedIn",
      url: settings.socials.linkedin,
    },
  ].filter((social) => social.url);

  return (
    <footer className="relative overflow-hidden bg-[#050505] px-5 pb-8 pt-20 text-white sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(199,173,134,0.12),transparent_28%)]" />

      <div className="relative mx-auto max-w-[1500px]">
        <div className="border-t border-white/10 pt-12">
          <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="flex items-center gap-3 text-xs uppercase tracking-[0.38em] text-[#c7ad86]">
                <Sparkles size={15} />
                Signature promise
              </p>

              <h2 className="mt-6 max-w-5xl font-serif text-[clamp(3rem,6.2vw,7.2rem)] leading-[0.86] tracking-[-0.08em] text-white">
                ECLORA is the little glow you carry with you.
              </h2>

              <p className="mt-8 max-w-2xl text-base leading-8 text-white/55 md:text-lg">
                Elegant pieces, soft confidence, and details that stay close. A
                jewelry universe built to feel refined, warm, and personal.
              </p>
            </div>

            <div className="lg:pt-4">
              <h3 className="font-serif text-5xl leading-none tracking-[-0.06em] text-white">
                {settings.shopName || "ECLORA"}
              </h3>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/48">
                Fine jewelry, thoughtful details, and a premium shopping
                experience made to feel effortless.
              </p>

              <div className="mt-8 space-y-3">
                {settings.contact.phone && (
                  <a
                    href={`tel:${settings.contact.phone}`}
                    className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Phone size={16} />
                    {settings.contact.phone}
                  </a>
                )}

                {settings.contact.email && (
                  <a
                    href={`mailto:${settings.contact.email}`}
                    className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                  >
                    <Mail size={16} />
                    {settings.contact.email}
                  </a>
                )}

                {settings.contact.address && (
                  <p className="flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/70">
                    <MapPin size={16} />
                    {settings.contact.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-8 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                Socials
              </p>

              {socialLinks.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/65 transition hover:border-white/30 hover:bg-white hover:text-black"
                    >
                      {social.label}
                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/40">
                  Social links will appear here.
                </p>
              )}
            </div>

            <p className="text-sm text-white/35">
              {settings.footerText || "© ECLORA. All rights reserved."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
