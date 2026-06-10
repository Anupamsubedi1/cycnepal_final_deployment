export type ProvinceDistrictGroup = {
  id: string;
  name: string;
  districts: string[];
};

export const provincesDistricts: ProvinceDistrictGroup[] = [
  {
    id: "pradesh-1",
    name: "Koshi Province",
    districts: [
      "Taplejung",
      "Panchthar",
      "Ilam",
      "Jhapa",
      "Morang",
      "Sunsari",
      "Dhankuta",
      "Terhathum",
      "Sankhuwasabha",
      "Bhojpur",
      "Khotang",
      "Solukhumbu",
      "Okhaldhunga",
      "Udayapur",
    ],
  },
  {
    id: "pradesh-2",
    name: "Madhesh Province",
    districts: [
      "Saptari",
      "Siraha",
      "Dhanusha",
      "Mahottari",
      "Sarlahi",
      "Rautahat",
      "Bara",
      "Parsa",
    ],
  },
  {
    id: "bagmati",
    name: "Bagmati Province",
    districts: [
      "Dolakha",
      "Ramechhap",
      "Sindhuli",
      "Kavrepalanchok",
      "Sindhupalchok",
      "Rasuwa",
      "Nuwakot",
      "Dhading",
      "Chitwan",
      "Makwanpur",
      "Kathmandu",
      "Lalitpur",
      "Bhaktapur",
    ],
  },
  {
    id: "gandaki",
    name: "Gandaki Province",
    districts: [
      "Gorkha",
      "Lamjung",
      "Tanahun",
      "Kaski",
      "Manang",
      "Mustang",
      "Myagdi",
      "Parbat",
      "Syangja",
      "Nawalpur",
      "Baglung",
    ],
  },
  {
    id: "lumbini",
    name: "Lumbini Province",
    districts: [
      "Gulmi",
      "Palpa",
      "Arghakhanchi",
      "Rupandehi",
      "Kapilvastu",
      "Nawalparasi West",
      "Banke",
      "Bardiya",
      "Dang",
      "Rolpa",
      "Pyuthan",
      "Eastern Rukum",
    ],
  },
  {
    id: "karnali",
    name: "Karnali Province",
    districts: [
      "Salyan",
      "Rukum West",
      "Dolpa",
      "Mugu",
      "Humla",
      "Jumla",
      "Kalikot",
      "Dailekh",
      "Jajarkot",
      "Surkhet",
    ],
  },
  {
    id: "sudurpashchim",
    name: "Sudurpashchim Province",
    districts: [
      "Kanchanpur",
      "Kailali",
      "Dadeldhura",
      "Baitadi",
      "Darchula",
      "Bajhang",
      "Bajura",
      "Achham",
      "Doti",
    ],
  },
];

export const allDistricts = provincesDistricts.flatMap((province) =>
  province.districts.map((district) => ({
    name: district,
    provinceId: province.id,
    provinceName: province.name,
  }))
);

export const getDistrictsByProvince = (provinceId: string): string[] => {
  const province = provincesDistricts.find((group) => group.id === provinceId);
  return province ? province.districts : [];
};

export const searchDistricts = (query: string, provinceId?: string): string[] => {
  const normalized = query.trim().toLowerCase();
  const source = provinceId ? getDistrictsByProvince(provinceId) : allDistricts.map((district) => district.name);

  if (!normalized) {
    return source;
  }

  return source.filter((district) => district.toLowerCase().startsWith(normalized));
};
