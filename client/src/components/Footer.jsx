import { useEffect, useState } from "react";
import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
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
    <footer className="border-t border-stone-200 bg-stone-950 px-6 py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <h2 className="text-3xl font-black tracking-[0.18em]">
            {settings.shopName || "ECLORA"}
          </h2>

          <p className="mt-4 max-w-md text-sm leading-7 text-white/55">
            Elegant jewelry, soft glow, premium shopping experience.
          </p>

          <p className="mt-6 text-sm text-white/40">{settings.footerText}</p>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/40">
            Contact
          </h3>

          <div className="mt-5 space-y-3 text-sm text-white/65">
            {settings.contact.phone && (
              <p className="flex items-center gap-3">
                <Phone size={16} />
                {settings.contact.phone}
              </p>
            )}

            {settings.contact.email && (
              <p className="flex items-center gap-3 break-all">
                <Mail size={16} />
                {settings.contact.email}
              </p>
            )}

            {settings.contact.address && (
              <p className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                {settings.contact.address}
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.3em] text-white/40">
            Socials
          </h3>

          {socialLinks.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm text-white/70 transition hover:bg-white hover:text-stone-950"
                >
                  {social.label}
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-white/45">
              Social links will appear here.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
