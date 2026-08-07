import { useEffect, useState } from "react";
import {
  ImagePlus,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const defaultForm = {
  shopName: "ECLORA",
  logoUrl: "",
  announcementText: "",
  hero: {
    eyebrow: "",
    title: "",
    subtitle: "",
    primaryButtonText: "",
    primaryButtonLink: "",
    secondaryButtonText: "",
    secondaryButtonLink: "",
    slides: [],
  },
  about: {
    title: "",
    text: "",
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
  footerText: "",
};

const emptySlide = {
  imageUrl: "",
  title: "",
  subtitle: "",
  isActive: true,
  sortOrder: 0,
};

const AdminSiteSettings = () => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSlideIndex, setUploadingSlideIndex] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const res = await api.get("/site-settings");

      setForm({
        ...defaultForm,
        ...res.data,
        hero: {
          ...defaultForm.hero,
          ...res.data.hero,
          slides: res.data.hero?.slides || [],
        },
        about: {
          ...defaultForm.about,
          ...res.data.about,
        },
        contact: {
          ...defaultForm.contact,
          ...res.data.contact,
        },
        socials: {
          ...defaultForm.socials,
          ...res.data.socials,
        },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load site settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateRootField = (field, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      [field]: value,
    }));
  };

  const updateSectionField = (section, field, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      [section]: {
        ...prevForm[section],
        [field]: value,
      },
    }));
  };

  const updateHeroField = (field, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      hero: {
        ...prevForm.hero,
        [field]: value,
      },
    }));
  };

  const uploadImage = async (file) => {
    if (!file) return "";

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      return "";
    }

    const formData = new FormData();
    formData.append("image", file);

    const res = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.url;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading logo...");

    try {
      setUploadingLogo(true);

      const imageUrl = await uploadImage(file);

      if (imageUrl) {
        updateRootField("logoUrl", imageUrl);

        toast.success("Logo uploaded.", {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Logo upload failed.", {
        id: toastId,
      });
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const addSlide = () => {
    setForm((prevForm) => ({
      ...prevForm,
      hero: {
        ...prevForm.hero,
        slides: [
          ...prevForm.hero.slides,
          {
            ...emptySlide,
            sortOrder: prevForm.hero.slides.length,
          },
        ],
      },
    }));
  };

  const updateSlide = (index, field, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      hero: {
        ...prevForm.hero,
        slides: prevForm.hero.slides.map((slide, slideIndex) =>
          slideIndex === index
            ? {
                ...slide,
                [field]: value,
              }
            : slide,
        ),
      },
    }));
  };

  const removeSlide = (index) => {
    setForm((prevForm) => ({
      ...prevForm,
      hero: {
        ...prevForm.hero,
        slides: prevForm.hero.slides.filter(
          (_, slideIndex) => slideIndex !== index,
        ),
      },
    }));
  };

  const handleSlideUpload = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading hero image...");

    try {
      setUploadingSlideIndex(index);

      const imageUrl = await uploadImage(file);

      if (imageUrl) {
        updateSlide(index, "imageUrl", imageUrl);

        toast.success("Hero image uploaded.", {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Image upload failed.", {
        id: toastId,
      });
    } finally {
      setUploadingSlideIndex(null);
      e.target.value = "";
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    if (!form.shopName.trim()) {
      toast.error("Shop name is required.");
      return;
    }

    if (!form.hero.title.trim()) {
      toast.error("Hero title is required.");
      return;
    }

    const payload = {
      shopName: form.shopName.trim(),
      logoUrl: form.logoUrl.trim(),
      announcementText: form.announcementText.trim(),

      hero: {
        eyebrow: form.hero.eyebrow.trim(),
        title: form.hero.title.trim(),
        subtitle: form.hero.subtitle.trim(),
        primaryButtonText: form.hero.primaryButtonText.trim(),
        primaryButtonLink: form.hero.primaryButtonLink.trim(),
        secondaryButtonText: form.hero.secondaryButtonText.trim(),
        secondaryButtonLink: form.hero.secondaryButtonLink.trim(),
        slides: form.hero.slides.map((slide, index) => ({
          imageUrl: slide.imageUrl.trim(),
          title: slide.title.trim(),
          subtitle: slide.subtitle.trim(),
          isActive: Boolean(slide.isActive),
          sortOrder: Number(slide.sortOrder || index),
        })),
      },

      about: {
        title: form.about.title.trim(),
        text: form.about.text.trim(),
      },

      contact: {
        phone: form.contact.phone.trim(),
        email: form.contact.email.trim(),
        address: form.contact.address.trim(),
        whatsapp: form.contact.whatsapp.trim(),
      },

      socials: {
        instagram: form.socials.instagram.trim(),
        facebook: form.socials.facebook.trim(),
        tiktok: form.socials.tiktok.trim(),
        linkedin: form.socials.linkedin.trim(),
      },

      footerText: form.footerText.trim(),
    };

    const toastId = toast.loading("Saving site settings...");

    try {
      setSaving(true);

      const res = await api.put("/site-settings", payload);
      localStorage.setItem(
        "ecloraBrandSettings",
        JSON.stringify({
          shopName: res.data.shopName || "ECLORA",
          logoUrl: res.data.logoUrl || "",
        }),
      );

      window.dispatchEvent(
        new CustomEvent("site-settings-updated", {
          detail: {
            shopName: res.data.shopName || "ECLORA",
            logoUrl: res.data.logoUrl || "",
          },
        }),
      );

      setForm({
        ...defaultForm,
        ...res.data,
        hero: {
          ...defaultForm.hero,
          ...res.data.hero,
          slides: res.data.hero?.slides || [],
        },
        about: {
          ...defaultForm.about,
          ...res.data.about,
        },
        contact: {
          ...defaultForm.contact,
          ...res.data.contact,
        },
        socials: {
          ...defaultForm.socials,
          ...res.data.socials,
        },
      });

      toast.success("Site settings saved.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save settings.", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    const confirmReset = window.confirm(
      "Reset all site settings to default values?",
    );

    if (!confirmReset) return;

    const toastId = toast.loading("Resetting site settings...");

    try {
      setResetting(true);

      const res = await api.post("/site-settings/reset");

      const settings = res.data.settings;

      setForm({
        ...defaultForm,
        ...settings,
        hero: {
          ...defaultForm.hero,
          ...settings.hero,
          slides: settings.hero?.slides || [],
        },
        about: {
          ...defaultForm.about,
          ...settings.about,
        },
        contact: {
          ...defaultForm.contact,
          ...settings.contact,
        },
        socials: {
          ...defaultForm.socials,
          ...settings.socials,
        },
      });

      toast.success("Site settings reset.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not reset settings.",
        {
          id: toastId,
        },
      );
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-stone-50 px-6 py-16">
        <p className="text-center text-stone-500">Loading site settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] bg-stone-50 px-6 py-10">
      <form onSubmit={saveSettings} className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-stone-400">
              Admin
            </p>

            <h1 className="mt-3 text-4xl font-bold text-stone-950">
              Site Settings
            </h1>

            <p className="mt-3 text-stone-500">
              Edit your storefront content, hero slideshow, contact and footer.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchSettings}
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm text-stone-600 transition hover:border-stone-950 hover:text-stone-950"
            >
              <RefreshCcw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={resetSettings}
              disabled={resetting}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={17} />
              {resetting ? "Resetting..." : "Reset"}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-stone-100 text-stone-950">
                  <Settings size={19} />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-stone-950">
                    Brand Identity
                  </h2>

                  <p className="text-sm text-stone-500">
                    Main shop information.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Shop name
                  </label>

                  <input
                    value={form.shopName}
                    onChange={(e) =>
                      updateRootField("shopName", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="ECLORA"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Announcement text
                  </label>

                  <input
                    value={form.announcementText}
                    onChange={(e) =>
                      updateRootField("announcementText", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="Free delivery on selected orders."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-stone-700">
                    Logo URL
                  </label>

                  <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto]">
                    <input
                      value={form.logoUrl}
                      onChange={(e) =>
                        updateRootField("logoUrl", e.target.value)
                      }
                      className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                      placeholder="https://..."
                    />

                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
                      <Upload size={17} />
                      {uploadingLogo ? "Uploading..." : "Upload logo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-stone-950">
                  Hero Content
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Text displayed on the home hero section.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Eyebrow
                  </label>

                  <input
                    value={form.hero.eyebrow}
                    onChange={(e) => updateHeroField("eyebrow", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="Jewelry for soft power moments"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Title
                  </label>

                  <input
                    value={form.hero.title}
                    onChange={(e) => updateHeroField("title", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="Elegant jewelry made to glow every day."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-stone-700">
                    Subtitle
                  </label>

                  <textarea
                    value={form.hero.subtitle}
                    onChange={(e) =>
                      updateHeroField("subtitle", e.target.value)
                    }
                    rows="3"
                    className="mt-2 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="Discover refined pieces..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Primary button text
                  </label>

                  <input
                    value={form.hero.primaryButtonText}
                    onChange={(e) =>
                      updateHeroField("primaryButtonText", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="Shop now"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Primary button link
                  </label>

                  <input
                    value={form.hero.primaryButtonLink}
                    onChange={(e) =>
                      updateHeroField("primaryButtonLink", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="/#products"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Secondary button text
                  </label>

                  <input
                    value={form.hero.secondaryButtonText}
                    onChange={(e) =>
                      updateHeroField("secondaryButtonText", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="View collections"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    Secondary button link
                  </label>

                  <input
                    value={form.hero.secondaryButtonLink}
                    onChange={(e) =>
                      updateHeroField("secondaryButtonLink", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="/#collections"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-950">
                    Hero Slideshow
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Add up to 8 images for the animated hero.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addSlide}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                >
                  <Plus size={17} />
                  Add slide
                </button>
              </div>

              {form.hero.slides.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-stone-300 p-10 text-center">
                  <ImagePlus size={36} className="mx-auto text-stone-300" />

                  <p className="mt-3 font-medium text-stone-950">
                    No hero slides yet.
                  </p>

                  <p className="mt-1 text-sm text-stone-500">
                    Add your first image to prepare the homepage slideshow.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5">
                  {form.hero.slides.map((slide, index) => (
                    <div
                      key={`slide-${index}`}
                      className="grid gap-4 rounded-[2rem] border border-stone-100 bg-stone-50 p-4 lg:grid-cols-[220px_1fr_auto]"
                    >
                      <div className="overflow-hidden rounded-3xl bg-white">
                        {slide.imageUrl ? (
                          <img
                            src={slide.imageUrl}
                            alt={`Hero slide ${index + 1}`}
                            className="h-44 w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-44 place-items-center text-stone-300">
                            <ImagePlus size={34} />
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-stone-700">
                            Image URL
                          </label>

                          <input
                            value={slide.imageUrl}
                            onChange={(e) =>
                              updateSlide(index, "imageUrl", e.target.value)
                            }
                            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-stone-900"
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-stone-700">
                            Slide title
                          </label>

                          <input
                            value={slide.title}
                            onChange={(e) =>
                              updateSlide(index, "title", e.target.value)
                            }
                            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-stone-900"
                            placeholder="New glow collection"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-stone-700">
                            Sort order
                          </label>

                          <input
                            type="number"
                            min="0"
                            value={slide.sortOrder}
                            onChange={(e) =>
                              updateSlide(index, "sortOrder", e.target.value)
                            }
                            className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-stone-900"
                            placeholder="0"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-stone-700">
                            Slide subtitle
                          </label>

                          <textarea
                            value={slide.subtitle}
                            onChange={(e) =>
                              updateSlide(index, "subtitle", e.target.value)
                            }
                            rows="2"
                            className="mt-2 w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none focus:border-stone-900"
                            placeholder="A soft premium sentence..."
                          />
                        </div>

                        <label className="flex items-center gap-3 text-sm text-stone-700">
                          <input
                            type="checkbox"
                            checked={Boolean(slide.isActive)}
                            onChange={(e) =>
                              updateSlide(index, "isActive", e.target.checked)
                            }
                            className="h-4 w-4 accent-stone-950"
                          />
                          Active slide
                        </label>
                      </div>

                      <div className="flex gap-2 lg:flex-col">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm text-white transition hover:bg-stone-700">
                          <Upload size={16} />
                          {uploadingSlideIndex === index
                            ? "Uploading..."
                            : "Upload"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlideUpload(index, e)}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => removeSlide(index)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-stone-950">About</h2>

                <p className="mt-1 text-sm text-stone-500">
                  Text for the about section.
                </p>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="text-sm font-medium text-stone-700">
                    About title
                  </label>

                  <input
                    value={form.about.title}
                    onChange={(e) =>
                      updateSectionField("about", "title", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="About ECLORA"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700">
                    About text
                  </label>

                  <textarea
                    value={form.about.text}
                    onChange={(e) =>
                      updateSectionField("about", "text", e.target.value)
                    }
                    rows="5"
                    className="mt-2 w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                    placeholder="Your brand story..."
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">Preview</h2>

              <div className="mt-5 overflow-hidden rounded-[2rem] bg-stone-950 text-white">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt={form.shopName}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-32 place-items-center bg-white/5">
                    <p className="text-3xl font-black tracking-[0.25em]">
                      {form.shopName || "ECLORA"}
                    </p>
                  </div>
                )}

                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    {form.hero.eyebrow || "Hero eyebrow"}
                  </p>

                  <h3 className="mt-3 text-2xl font-bold">
                    {form.hero.title || "Hero title"}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-white/60">
                    {form.hero.subtitle || "Hero subtitle"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">Contact</h2>

              <div className="mt-5 space-y-4">
                <input
                  value={form.contact.phone}
                  onChange={(e) =>
                    updateSectionField("contact", "phone", e.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="Phone"
                />

                <input
                  value={form.contact.email}
                  onChange={(e) =>
                    updateSectionField("contact", "email", e.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="Email"
                />

                <input
                  value={form.contact.whatsapp}
                  onChange={(e) =>
                    updateSectionField("contact", "whatsapp", e.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="WhatsApp"
                />

                <textarea
                  value={form.contact.address}
                  onChange={(e) =>
                    updateSectionField("contact", "address", e.target.value)
                  }
                  rows="3"
                  className="w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="Address"
                />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">Socials</h2>

              <div className="mt-5 space-y-4">
                <input
                  value={form.socials.instagram}
                  onChange={(e) =>
                    updateSectionField("socials", "instagram", e.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="Instagram URL"
                />

                <input
                  value={form.socials.facebook}
                  onChange={(e) =>
                    updateSectionField("socials", "facebook", e.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="Facebook URL"
                />

                <input
                  value={form.socials.tiktok}
                  onChange={(e) =>
                    updateSectionField("socials", "tiktok", e.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="TikTok URL"
                />

                <input
                  value={form.socials.linkedin}
                  onChange={(e) =>
                    updateSectionField("socials", "linkedin", e.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                  placeholder="LinkedIn URL"
                />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-stone-950">Footer</h2>

              <input
                value={form.footerText}
                onChange={(e) => updateRootField("footerText", e.target.value)}
                className="mt-5 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-stone-900"
                placeholder="© ECLORA. All rights reserved."
              />
            </section>
          </aside>
        </div>
      </form>
    </main>
  );
};

export default AdminSiteSettings;
