import wilayas from "./wilayas.json";
import communes from "./communes.json";

const getField = (obj, keys) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }

  return "";
};

const normalizeText = (text) =>
  String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizeCode = (code) => String(code || "").padStart(2, "0");

export const WILAYAS = wilayas
  .map((wilaya) => {
    const code = normalizeCode(
      getField(wilaya, ["code", "id", "wilaya_code", "code_wilaya"]),
    );

    const name = getField(wilaya, [
      "name",
      "name_fr",
      "wilaya_name",
      "wilaya_name_fr",
      "nom",
      "nom_fr",
    ]);

    const arName = getField(wilaya, [
      "name_ar",
      "ar_name",
      "wilaya_name_ar",
      "nom_ar",
    ]);

    return {
      code,
      name,
      arName,
    };
  })
  .filter((wilaya) => wilaya.code && wilaya.name)
  .sort((a, b) => Number(a.code) - Number(b.code));

export const getCommunesByWilayaName = (wilayaName) => {
  if (!wilayaName) return [];

  const selectedWilaya = WILAYAS.find(
    (wilaya) => normalizeText(wilaya.name) === normalizeText(wilayaName),
  );

  if (!selectedWilaya) return [];

  return communes
    .map((commune) => {
      const wilayaCode = normalizeCode(
        getField(commune, [
          "wilaya_code",
          "code_wilaya",
          "wilayaId",
          "wilaya_id",
        ]),
      );

      const name = getField(commune, [
        "name",
        "name_fr",
        "commune_name",
        "commune_name_fr",
        "nom",
        "nom_fr",
      ]);

      const arName = getField(commune, [
        "name_ar",
        "ar_name",
        "commune_name_ar",
        "nom_ar",
      ]);

      const daira = getField(commune, [
        "daira",
        "daira_name",
        "daira_name_fr",
        "daira_fr",
      ]);

      const code = getField(commune, [
        "code",
        "id",
        "commune_code",
        "code_commune",
      ]);

      return {
        wilayaCode,
        value: name,
        label: name,
        arName,
        daira,
        code,
      };
    })
    .filter(
      (commune) => commune.wilayaCode === selectedWilaya.code && commune.value,
    )
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
};
