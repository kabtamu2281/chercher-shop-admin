import { Category, Product, UnitType } from '../types';

export const CHERCHER_CATEGORIES: Category[] = [
  {
    id: 'cat_paints',
    name: 'Paints & Thinner',
    nameAm: 'ቀለሞች እና ማቅጠኛ',
    nameOm: 'Halluu fi Qalliftuu',
    description: 'Enamel, antirust, varnish, lacquers, stainers and thinners',
    icon: 'format_paint',
  },
  {
    id: 'cat_glue',
    name: 'Glue, Putty & Sealants',
    nameAm: 'ማጣበቂያ፣ ማስቲሽ እና ሲሊኮን',
    nameOm: 'Qabsiiftuu fi Mastishii',
    description: 'Damac glue, Rodas glue, wall putty (mastish), Ferostibo, silicone',
    icon: 'colors',
  },
  {
    id: 'cat_cement',
    name: 'Cement, Gypsum & Plaster',
    nameAm: 'ሲሚንቶ፣ ጂፕሰም እና ኖራ',
    nameOm: 'Simintoo, Jiipsamii & Nooraa',
    description: 'Dangote & Mugher cement, gypsum powder (ganch), kalki lime, plaster',
    icon: 'package_2',
  },
  {
    id: 'cat_steel_rebar',
    name: 'Structural Steel & Rebar',
    nameAm: 'የግንባታ ብረት እና ቆርቆሮ',
    nameOm: 'Biraata Ijaarsaa',
    description: 'Grade 60 rebar, corrugated zinc sheets, EGA roofing sheets',
    icon: 'construction',
  },
  {
    id: 'cat_painting_tools',
    name: 'Painting Tools & Sandpaper',
    nameAm: 'የቀለም ብሩሽ እና የበረሃ ወረቀት',
    nameOm: 'Biriishii Halluu & Sandpaper',
    description: 'Paint brushes (1"-4"), roll brushes, sandpaper (P40-P220), masking tape, spiders',
    icon: 'brush',
  },
  {
    id: 'cat_nails',
    name: 'Nails & Roofing Nails',
    nameAm: 'የተለያዩ ሚስማሮች',
    nameOm: 'Mismara Ijaarsaa',
    description: 'Wood nails (1/2" to 12"), concrete nails, roofing nails (kob mismar), shoe nails',
    icon: 'push_pin',
  },
  {
    id: 'cat_screws_bolts',
    name: 'Screws, Bolts, Nuts & Plugs',
    nameAm: 'ቦልቶች፣ ብሎኖች እና ፊሸር',
    nameOm: 'Booltii, Tirnoo fi Fisher',
    description: 'Machine bolts, nuts (dado), drywall screws, torno, wall plugs (fisher), washers',
    icon: 'hardware',
  },
  {
    id: 'cat_electrical',
    name: 'Electrical Supplies',
    nameAm: 'የኤሌክትሪክ እቃዎች',
    nameOm: 'Meeshaalee Elektiriikaa',
    description: 'Breakers, CHNT switches, wire (1.5-4mm), bulbs, sockets, flexible conduit',
    icon: 'bolt',
  },
  {
    id: 'cat_plumbing',
    name: 'Plumbing & Pipes',
    nameAm: 'የቧንቧ እቃዎች እና ፊቲንግ',
    nameOm: 'Ujummoo Bishaanii fi Fiitiingii',
    description: 'PPR pipes, fittings, gate valves, GS elbows, teflon tape, water hoses, faucets',
    icon: 'plumbing',
  },
  {
    id: 'cat_tools',
    name: 'Tools & Welding',
    nameAm: 'እጅ መሳሪያዎች እና ዌልዲንግ',
    nameOm: 'Meeshaalee Harka fi Weldiingii',
    description: 'Cutting discs, grinding wheels, drill bits (punta), measuring tapes, welding rods',
    icon: 'home_repair_service',
  },
  {
    id: 'cat_locks',
    name: 'Locks, Hinges & Handles',
    nameAm: 'ቁልፎች፣ ማጠፊያዎች እና እጀታ',
    nameOm: 'Qulfii, Kaasaa fi Qabannoo',
    description: 'Cobra cylinder locks, key locks, Oxford hinges, door handles',
    icon: 'lock',
  },
  {
    id: 'cat_decorative',
    name: 'Decorative (Ejeta Circles)',
    nameAm: 'የጌጥ እጀታ ክብ',
    nameOm: 'Ejeta Faayaa',
    description: 'Decorative ejeta circles in black, gold, and silver (15cm, 20cm)',
    icon: 'stars',
  },
  {
    id: 'cat_other',
    name: 'Other Hardware',
    nameAm: 'ልዩ ልዩ የግንባታ እቃዎች',
    nameOm: 'Meeshaalee Biroo',
    description: 'Bica afer, Key afer, Lastro, Sibago, TVP, SFL, Cricketo',
    icon: 'category',
  },
  {
    id: 'cat_needs_naming',
    name: 'Inventory Needs Review',
    nameAm: 'ስም መስተካከል ያለባቸው እቃዎች',
    nameOm: 'Qulqullina Maqaa Barbaadan',
    description: 'Items recorded from shop memos, receipts, and photos requiring stock verification',
    icon: 'pending_actions',
  },
];

interface RawChercherItem {
  cat: string;
  name: string;
  unit: UnitType;
  cost?: number;
  price: number;
  reorder: number;
  sold: number;
  needsChecking?: boolean;
}

const RAW_CHERCHER_DATA: RawChercherItem[] = [
  // Paints & thinner
  { cat: 'cat_paints', name: 'Antirust Panda 1kg', unit: 'pc', cost: 850, price: 1000, reorder: 1, sold: 4 },
  { cat: 'cat_paints', name: 'Antirust Panda gallon', unit: 'gallon', cost: 2743.75, price: 3000, reorder: 1, sold: 3 },
  { cat: 'cat_paints', name: 'Jet black 1kg', unit: 'pc', cost: 1300, price: 1600, reorder: 3, sold: 10 },
  { cat: 'cat_paints', name: 'Jet gold 1kg', unit: 'pc', cost: 1300, price: 1500, reorder: 1, sold: 4 },
  { cat: 'cat_paints', name: 'Jet paint 1kg (colour unclear)', unit: 'pc', cost: 1400, price: 1500, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_paints', name: 'Jet paint gallon', unit: 'gallon', cost: 4500, price: 4900, reorder: 4, sold: 14 },
  { cat: 'cat_paints', name: 'Jet silver 1kg', unit: 'pc', cost: 1400, price: 1600, reorder: 3, sold: 10 },
  { cat: 'cat_paints', name: 'Jet white 1kg', unit: 'pc', cost: 1400, price: 1600, reorder: 3, sold: 12 },
  { cat: 'cat_paints', name: 'Lacquer 1kg', unit: 'pc', cost: 950, price: 1100, reorder: 4, sold: 15 },
  { cat: 'cat_paints', name: 'Lacquer gallon', unit: 'gallon', cost: 2600, price: 3000, reorder: 3, sold: 9 },
  { cat: 'cat_paints', name: 'Nifas Silk paint (size unclear)', unit: 'gallon', cost: 1800, price: 2100, reorder: 1, sold: 4, needsChecking: true },
  { cat: 'cat_paints', name: 'Nifas Silk Simba 3.5L', unit: 'gallon', cost: 947, price: 1150, reorder: 4, sold: 13 },
  { cat: 'cat_paints', name: 'Nifas Silk Simba 4L', unit: 'gallon', cost: 1032, price: 1300, reorder: 3, sold: 9 },
  { cat: 'cat_paints', name: 'Nifas Silk Simba gallon (big)', unit: 'gallon', cost: 3800, price: 4500, reorder: 3, sold: 12 },
  { cat: 'cat_paints', name: 'Nifas Silk SP 4L', unit: 'gallon', cost: 2694, price: 3000, reorder: 1, sold: 3 },
  { cat: 'cat_paints', name: 'Nifas Silk Super 3.5L', unit: 'gallon', cost: 1586, price: 1700, reorder: 1, sold: 1 },
  { cat: 'cat_paints', name: 'Oil super paint', unit: 'pc', cost: 1100, price: 1300, reorder: 1, sold: 0, needsChecking: true },
  { cat: 'cat_paints', name: 'Oil wanbet paint', unit: 'pc', cost: 550, price: 650, reorder: 3, sold: 10, needsChecking: true },
  { cat: 'cat_paints', name: 'Panda 401 1kg', unit: 'pc', cost: 680, price: 800, reorder: 1, sold: 1 },
  { cat: 'cat_paints', name: 'Panda 402 1kg', unit: 'pc', cost: 680, price: 800, reorder: 4, sold: 13 },
  { cat: 'cat_paints', name: 'Panda 419 1kg', unit: 'pc', cost: 687.5, price: 800, reorder: 1, sold: 1 },
  { cat: 'cat_paints', name: 'Panda 423 1kg', unit: 'pc', cost: 650, price: 750, reorder: 1, sold: 2 },
  { cat: 'cat_paints', name: 'Panda 427 1kg', unit: 'pc', cost: 665, price: 780, reorder: 1, sold: 0 },
  { cat: 'cat_paints', name: 'Panda paint 1kg (code unclear)', unit: 'pc', cost: 300, price: 350, reorder: 1, sold: 3, needsChecking: true },
  { cat: 'cat_paints', name: 'Poly varnish gallon', unit: 'gallon', cost: 3767.69, price: 4000, reorder: 1, sold: 1 },
  { cat: 'cat_paints', name: 'Rodas Super 3.5L', unit: 'gallon', cost: 860, price: 1000, reorder: 1, sold: 1 },
  { cat: 'cat_paints', name: 'Rodas varnish 1kg', unit: 'pc', cost: 867, price: 1000, reorder: 4, sold: 14 },
  { cat: 'cat_paints', name: 'Rodas varnish Alkyd gallon', unit: 'gallon', cost: 3450, price: 4000, reorder: 1, sold: 1 },
  { cat: 'cat_paints', name: 'Rodas wanbet', unit: 'pc', cost: 565, price: 650, reorder: 3, sold: 10, needsChecking: true },
  { cat: 'cat_paints', name: 'Sofatin 212', unit: 'pc', cost: 340, price: 400, reorder: 2, sold: 8 },
  { cat: 'cat_paints', name: 'Sofatin 301', unit: 'pc', cost: 340, price: 400, reorder: 1, sold: 1 },
  { cat: 'cat_paints', name: 'Sofatin 316', unit: 'pc', cost: 350, price: 400, reorder: 2, sold: 8 },
  { cat: 'cat_paints', name: 'Sofatin 409', unit: 'pc', cost: 350, price: 420, reorder: 1, sold: 0 },
  { cat: 'cat_paints', name: 'Sofatin 420', unit: 'pc', cost: 340, price: 400, reorder: 1, sold: 2 },
  { cat: 'cat_paints', name: 'Sofatin 508', unit: 'pc', cost: 380, price: 450, reorder: 1, sold: 4 },
  { cat: 'cat_paints', name: 'Sofatin 620', unit: 'pc', cost: 380, price: 450, reorder: 1, sold: 3 },
  { cat: 'cat_paints', name: 'Sofatin 710', unit: 'pc', cost: 380, price: 450, reorder: 1, sold: 4 },
  { cat: 'cat_paints', name: 'Sofatin 820', unit: 'pc', cost: 380, price: 450, reorder: 1, sold: 1 },
  { cat: 'cat_paints', name: 'Stainer (colorant)', unit: 'pc', cost: 245, price: 280, reorder: 14, sold: 58 },
  { cat: 'cat_paints', name: 'Thinner Solvent (Litre)', unit: 'L', cost: 500, price: 600, reorder: 60, sold: 256 },

  // Glue, putty & sealants
  { cat: 'cat_glue', name: 'Damac glue 1kg', unit: 'pc', cost: 600, price: 700, reorder: 2, sold: 5 },
  { cat: 'cat_glue', name: 'Damac glue 5kg', unit: 'pc', cost: 2743.75, price: 3300, reorder: 5, sold: 21 },
  { cat: 'cat_glue', name: 'Ferostibo', unit: 'kg', cost: 240, price: 300, reorder: 3, sold: 11, needsChecking: true },
  { cat: 'cat_glue', name: 'Pastish', unit: 'pc', cost: 540, price: 650, reorder: 1, sold: 4, needsChecking: true },
  { cat: 'cat_glue', name: 'Putty (mastish) 1/2kg', unit: 'pc', cost: 385, price: 480, reorder: 1, sold: 0 },
  { cat: 'cat_glue', name: 'Putty (mastish) 1/4kg', unit: 'pc', cost: 145, price: 200, reorder: 3, sold: 9 },
  { cat: 'cat_glue', name: 'Putty (mastish) 1kg', unit: 'pc', cost: 490, price: 600, reorder: 3, sold: 9 },
  { cat: 'cat_glue', name: 'Putty (mastish) 300g', unit: 'pc', cost: 250, price: 300, reorder: 1, sold: 3 },
  { cat: 'cat_glue', name: 'Putty (mastish) OD-X 1kg', unit: 'pc', cost: 1050, price: 1250, reorder: 1, sold: 0, needsChecking: true },
  { cat: 'cat_glue', name: 'Putty (mastish) 1.5kg', unit: 'pc', cost: 980, price: 1200, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_glue', name: 'Rodas glue 1kg', unit: 'pc', cost: 702, price: 800, reorder: 4, sold: 17 },
  { cat: 'cat_glue', name: 'Rodas glue 5kg', unit: 'pc', cost: 2800, price: 3300, reorder: 1, sold: 1 },
  { cat: 'cat_glue', name: 'Silicone Sealant Tube', unit: 'pc', cost: 240, price: 300, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_glue', name: 'Wood fix adhesive', unit: 'pc', cost: 320, price: 400, reorder: 1, sold: 4 },

  // Cement, gypsum & plaster
  { cat: 'cat_cement', name: 'Gypsum powder (ganch)', unit: 'pc', cost: 165, price: 220, reorder: 6, sold: 24 },
  { cat: 'cat_cement', name: 'Korkoro plaster', unit: 'm', cost: 120, price: 150, reorder: 1, sold: 3, needsChecking: true },
  { cat: 'cat_cement', name: 'Lime (kalki) 25kg', unit: 'pc', cost: 450, price: 550, reorder: 5, sold: 19 },
  { cat: 'cat_cement', name: 'Dangote OPC Cement 42.5R (50kg)', unit: 'bag', cost: 1650, price: 1880, reorder: 50, sold: 120 },
  { cat: 'cat_cement', name: 'Mugher PPC Cement 32.5N (50kg)', unit: 'bag', cost: 1480, price: 1720, reorder: 40, sold: 90 },

  // Steel & Rebar
  { cat: 'cat_steel_rebar', name: 'Deformed Steel Rebar 12mm Grade 60', unit: 'quintal', cost: 12800, price: 14200, reorder: 15, sold: 35 },
  { cat: 'cat_steel_rebar', name: 'Deformed Steel Rebar 14mm Grade 60', unit: 'quintal', cost: 13000, price: 14500, reorder: 12, sold: 28 },
  { cat: 'cat_steel_rebar', name: 'Corrugated Galvanized Iron Sheet (G32, 3m)', unit: 'pc', cost: 980, price: 1150, reorder: 100, sold: 220 },

  // Painting tools & sandpaper
  { cat: 'cat_painting_tools', name: 'Abro masking tape', unit: 'pc', cost: 150, price: 200, reorder: 10, sold: 39, needsChecking: true },
  { cat: 'cat_painting_tools', name: 'Brush no.2', unit: 'pc', cost: 180, price: 225, reorder: 1, sold: 4 },
  { cat: 'cat_painting_tools', name: 'Brush Sali premium', unit: 'pc', cost: 520, price: 650, reorder: 1, sold: 1 },
  { cat: 'cat_painting_tools', name: 'Brush Victory', unit: 'pc', cost: 160, price: 200, reorder: 3, sold: 9 },
  { cat: 'cat_painting_tools', name: 'Paint brush 1"', unit: 'pc', cost: 24, price: 50, reorder: 1, sold: 4 },
  { cat: 'cat_painting_tools', name: 'Paint brush 2"', unit: 'pc', cost: 40, price: 100, reorder: 1, sold: 2 },
  { cat: 'cat_painting_tools', name: 'Paint brush 3"', unit: 'pc', cost: 51, price: 100, reorder: 3, sold: 11 },
  { cat: 'cat_painting_tools', name: 'Paint brush 4"', unit: 'pc', cost: 140, price: 200, reorder: 1, sold: 1 },
  { cat: 'cat_painting_tools', name: 'Paint roller (roll brush)', unit: 'pc', cost: 200, price: 250, reorder: 2, sold: 5 },
  { cat: 'cat_painting_tools', name: 'Sandpaper P40 (m)', unit: 'm', cost: 160, price: 200, reorder: 2, sold: 5 },
  { cat: 'cat_painting_tools', name: 'Sandpaper P60 (m)', unit: 'm', cost: 170, price: 200, reorder: 4, sold: 15 },
  { cat: 'cat_painting_tools', name: 'Sandpaper P80 (m)', unit: 'm', cost: 160, price: 200, reorder: 3, sold: 12 },
  { cat: 'cat_painting_tools', name: 'Sandpaper P120 (sheet)', unit: 'pc', cost: 170, price: 200, reorder: 5, sold: 20 },
  { cat: 'cat_painting_tools', name: 'Sandpaper P220 (sheet)', unit: 'pc', cost: 120, price: 150, reorder: 2, sold: 5 },
  { cat: 'cat_painting_tools', name: 'Spider 25cm scraper', unit: 'pc', cost: 160, price: 200, reorder: 1, sold: 3, needsChecking: true },
  { cat: 'cat_painting_tools', name: 'Spider 30cm scraper', unit: 'pc', cost: 160, price: 200, reorder: 7, sold: 28, needsChecking: true },
  { cat: 'cat_painting_tools', name: 'Spider 35cm scraper', unit: 'pc', cost: 160, price: 200, reorder: 4, sold: 13, needsChecking: true },

  // Nails & roofing nails
  { cat: 'cat_nails', name: 'Concrete nail', unit: 'pc', cost: 7, price: 10, reorder: 8, sold: 31 },
  { cat: 'cat_nails', name: 'Nail 10" (carton)', unit: 'carton', cost: 1130, price: 1300, reorder: 1, sold: 3 },
  { cat: 'cat_nails', name: 'Nail 10" (kg)', unit: 'kg', cost: 250, price: 300, reorder: 5, sold: 20 },
  { cat: 'cat_nails', name: 'Nail 12" (carton)', unit: 'carton', cost: 1130, price: 1300, reorder: 1, sold: 1 },
  { cat: 'cat_nails', name: 'Nail 3" (kg)', unit: 'kg', cost: 320, price: 400, reorder: 2, sold: 6 },
  { cat: 'cat_nails', name: 'Nail 4" (kg)', unit: 'kg', cost: 320, price: 400, reorder: 1, sold: 3 },
  { cat: 'cat_nails', name: 'Nail 4" (carton)', unit: 'carton', cost: 1130, price: 1300, reorder: 1, sold: 1 },
  { cat: 'cat_nails', name: 'Nail 5" (kg)', unit: 'kg', cost: 320, price: 400, reorder: 1, sold: 4 },
  { cat: 'cat_nails', name: 'Nail 6" (kg)', unit: 'kg', cost: 320, price: 400, reorder: 1, sold: 3 },
  { cat: 'cat_nails', name: 'Nail 6" (carton)', unit: 'carton', cost: 1130, price: 1300, reorder: 1, sold: 2 },
  { cat: 'cat_nails', name: 'Nail 7" (kg)', unit: 'kg', cost: 240, price: 300, reorder: 2, sold: 7 },
  { cat: 'cat_nails', name: 'Nail 7" (carton)', unit: 'carton', cost: 1130, price: 1300, reorder: 1, sold: 1 },
  { cat: 'cat_nails', name: 'Nail 8" (kg)', unit: 'kg', cost: 320, price: 400, reorder: 4, sold: 16 },
  { cat: 'cat_nails', name: 'Nail 9" (kg)', unit: 'kg', cost: 240, price: 300, reorder: 2, sold: 7 },
  { cat: 'cat_nails', name: 'Roofing nail (kob mismar) kg', unit: 'kg', cost: 320, price: 400, reorder: 6, sold: 26 },
  { cat: 'cat_nails', name: 'Shoe nail (chama mismar) box', unit: 'box', cost: 110, price: 150, reorder: 2, sold: 5 },

  // Screws, bolts, nuts & wall plugs
  { cat: 'cat_screws_bolts', name: 'Bolt 10mm', unit: 'pc', cost: 7, price: 10, reorder: 14, sold: 58 },
  { cat: 'cat_screws_bolts', name: 'Bolt 10x30', unit: 'pc', cost: 10, price: 15, reorder: 2, sold: 7 },
  { cat: 'cat_screws_bolts', name: 'Bolt 10x40', unit: 'pc', cost: 11, price: 15, reorder: 1, sold: 2 },
  { cat: 'cat_screws_bolts', name: 'Bolt 10x50', unit: 'pc', cost: 7, price: 13, reorder: 8, sold: 33 },
  { cat: 'cat_screws_bolts', name: 'Bolt 13mm', unit: 'pc', cost: 14, price: 20, reorder: 7, sold: 29 },
  { cat: 'cat_screws_bolts', name: 'Bolt 13x50', unit: 'pc', cost: 14, price: 20, reorder: 1, sold: 1 },
  { cat: 'cat_screws_bolts', name: 'Bolt 13x60', unit: 'pc', cost: 20, price: 30, reorder: 1, sold: 1 },
  { cat: 'cat_screws_bolts', name: 'Bolt 17mm', unit: 'pc', cost: 22, price: 30, reorder: 2, sold: 6 },
  { cat: 'cat_screws_bolts', name: 'Bolt 22x50', unit: 'pc', cost: 36, price: 50, reorder: 2, sold: 8 },
  { cat: 'cat_screws_bolts', name: 'Bolt 8x20', unit: 'pc', cost: 10, price: 15, reorder: 26, sold: 110 },
  { cat: 'cat_screws_bolts', name: 'Nut (dado) 10mm', unit: 'pc', cost: 3, price: 5, reorder: 8, sold: 34 },
  { cat: 'cat_screws_bolts', name: 'Nut (dado) 13mm', unit: 'pc', cost: 6, price: 10, reorder: 1, sold: 1 },
  { cat: 'cat_screws_bolts', name: 'Nut (dado) 17mm', unit: 'pc', cost: 6, price: 10, reorder: 4, sold: 14 },
  { cat: 'cat_screws_bolts', name: 'Screw 3.5x15 box', unit: 'box', cost: 420, price: 600, reorder: 1, sold: 1 },
  { cat: 'cat_screws_bolts', name: 'Screw 3.5x20 box', unit: 'box', cost: 450, price: 650, reorder: 1, sold: 1 },
  { cat: 'cat_screws_bolts', name: 'Screw 3.5x25 box', unit: 'box', cost: 500, price: 700, reorder: 2, sold: 6 },
  { cat: 'cat_screws_bolts', name: 'Screw 3.5x35 box', unit: 'box', cost: 500, price: 700, reorder: 1, sold: 1 },
  { cat: 'cat_screws_bolts', name: 'Screw 3.5x50 box', unit: 'box', cost: 570, price: 700, reorder: 1, sold: 4 },
  { cat: 'cat_screws_bolts', name: 'Screw 4.8x25 box', unit: 'box', cost: 520, price: 700, reorder: 1, sold: 4 },
  { cat: 'cat_screws_bolts', name: 'Screw 4.8x30 box', unit: 'box', cost: 520, price: 700, reorder: 1, sold: 3 },
  { cat: 'cat_screws_bolts', name: 'Screw Golden 6x80 box', unit: 'box', cost: 530, price: 800, reorder: 1, sold: 1 },
  { cat: 'cat_screws_bolts', name: 'Torno 7x40 (pc)', unit: 'pc', cost: 38, price: 50, reorder: 15, sold: 62, needsChecking: true },
  { cat: 'cat_screws_bolts', name: 'Torno 7x40 (box)', unit: 'box', cost: 580, price: 750, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_screws_bolts', name: 'Wall plug (fisher) 10mm', unit: 'pc', cost: 75, price: 79, reorder: 3, sold: 11 },
  { cat: 'cat_screws_bolts', name: 'Wall plug (fisher) 6mm', unit: 'pc', cost: 110, price: 150, reorder: 1, sold: 3 },
  { cat: 'cat_screws_bolts', name: 'Washer (rondel) 10mm', unit: 'pc', cost: 1.25, price: 5, reorder: 11, sold: 46 },
  { cat: 'cat_screws_bolts', name: 'Washer (rondel) 13mm', unit: 'pc', cost: 2.5, price: 5, reorder: 7, sold: 29 },

  // Electrical
  { cat: 'cat_electrical', name: 'Breaker box', unit: 'pc', cost: 280, price: 350, reorder: 2, sold: 7 },
  { cat: 'cat_electrical', name: 'Breaker CHNT (10/16/25A)', unit: 'pc', cost: 300, price: 400, reorder: 1, sold: 3 },
  { cat: 'cat_electrical', name: 'Breaker CHNT 25A', unit: 'pc', cost: 300, price: 400, reorder: 2, sold: 8 },
  { cat: 'cat_electrical', name: 'Breaker CHNT 32A', unit: 'pc', cost: 300, price: 400, reorder: 1, sold: 3 },
  { cat: 'cat_electrical', name: 'Bulb (ampule) 5W', unit: 'pc', cost: 75, price: 100, reorder: 1, sold: 1 },
  { cat: 'cat_electrical', name: 'Bulb (ampule) 9W', unit: 'pc', cost: 75, price: 100, reorder: 1, sold: 3 },
  { cat: 'cat_electrical', name: 'Bulb (ampule) 20W', unit: 'pc', cost: 150, price: 200, reorder: 1, sold: 1 },
  { cat: 'cat_electrical', name: 'Bulb (ampule) 30W', unit: 'pc', cost: 250, price: 325, reorder: 1, sold: 2 },
  { cat: 'cat_electrical', name: 'Bulb (ampule) 50W', unit: 'pc', cost: 480, price: 600, reorder: 1, sold: 1 },
  { cat: 'cat_electrical', name: 'Cable clip 8/10', unit: 'pc', cost: 14, price: 20, reorder: 10, sold: 42 },
  { cat: 'cat_electrical', name: 'Electric plug', unit: 'pc', cost: 70, price: 100, reorder: 6, sold: 22 },
  { cat: 'cat_electrical', name: 'Electric wire 1.5mm (roll)', unit: 'roll', cost: 1900, price: 2100, reorder: 2, sold: 5 },
  { cat: 'cat_electrical', name: 'Flexible conduit (m)', unit: 'm', cost: 26, price: 35, reorder: 13, sold: 53 },
  { cat: 'cat_electrical', name: 'Socket box', unit: 'pc', cost: 110, price: 150, reorder: 5, sold: 20 },
  { cat: 'cat_electrical', name: 'Tempo double switch', unit: 'pc', cost: 190, price: 250, reorder: 3, sold: 9 },
  { cat: 'cat_electrical', name: 'Tempo single socket', unit: 'pc', cost: 150, price: 200, reorder: 3, sold: 9 },
  { cat: 'cat_electrical', name: 'Tempo single switch', unit: 'pc', cost: 150, price: 200, reorder: 4, sold: 15 },

  // Plumbing
  { cat: 'cat_plumbing', name: 'Angle valve Golden Dragon 1/2"', unit: 'pc', cost: 250, price: 325, reorder: 1, sold: 4 },
  { cat: 'cat_plumbing', name: 'Check valve 1/2"', unit: 'pc', cost: 320, price: 400, reorder: 1, sold: 1 },
  { cat: 'cat_plumbing', name: 'Faucet 3/4"', unit: 'pc', cost: 750, price: 950, reorder: 3, sold: 12 },
  { cat: 'cat_plumbing', name: 'Faucet hand wash', unit: 'pc', cost: 620, price: 800, reorder: 1, sold: 1 },
  { cat: 'cat_plumbing', name: 'Gate valve 1/2"', unit: 'pc', cost: 650, price: 750, reorder: 2, sold: 5 },
  { cat: 'cat_plumbing', name: 'Gate valve 3/4"', unit: 'pc', cost: 750, price: 925, reorder: 1, sold: 2 },
  { cat: 'cat_plumbing', name: 'Gate valve Rambo 1/2"', unit: 'pc', cost: 600, price: 750, reorder: 3, sold: 10 },
  { cat: 'cat_plumbing', name: 'GS elbow 1/2"', unit: 'pc', cost: 40, price: 50, reorder: 11, sold: 46 },
  { cat: 'cat_plumbing', name: 'GS nipple 1/2"', unit: 'pc', cost: 45, price: 60, reorder: 8, sold: 31 },
  { cat: 'cat_plumbing', name: 'GS socket 1/2"', unit: 'pc', cost: 45, price: 50, reorder: 11, sold: 45 },
  { cat: 'cat_plumbing', name: 'GS tee 1/2"', unit: 'pc', cost: 70, price: 100, reorder: 1, sold: 4 },
  { cat: 'cat_plumbing', name: 'GS union 1/2"', unit: 'pc', cost: 115, price: 150, reorder: 5, sold: 18 },
  { cat: 'cat_plumbing', name: 'PPR chrome valve 1/2"', unit: 'pc', cost: 500, price: 650, reorder: 1, sold: 1 },
  { cat: 'cat_plumbing', name: 'PPR elbow 1/2"', unit: 'pc', cost: 18, price: 25, reorder: 3, sold: 10 },
  { cat: 'cat_plumbing', name: 'PPR elbow 3/4"', unit: 'pc', cost: 32, price: 45, reorder: 7, sold: 28 },
  { cat: 'cat_plumbing', name: 'PPR pipe 1/2" (4m)', unit: 'pc', cost: 360, price: 450, reorder: 11, sold: 45 },
  { cat: 'cat_plumbing', name: 'PPR pipe 3/4" (4m)', unit: 'pc', cost: 430, price: 530, reorder: 4, sold: 16 },
  { cat: 'cat_plumbing', name: 'PPR socket 1/2"', unit: 'pc', cost: 18, price: 25, reorder: 3, sold: 12 },
  { cat: 'cat_plumbing', name: 'PPR socket 3/4"', unit: 'pc', cost: 32, price: 45, reorder: 6, sold: 23 },
  { cat: 'cat_plumbing', name: 'PPR tee 1/2"', unit: 'pc', cost: 22, price: 30, reorder: 2, sold: 5 },
  { cat: 'cat_plumbing', name: 'PPR tee 3/4"', unit: 'pc', cost: 40, price: 55, reorder: 3, sold: 10 },
  { cat: 'cat_plumbing', name: 'PPR union 1/2"', unit: 'pc', cost: 30, price: 80, reorder: 1, sold: 3 },
  { cat: 'cat_plumbing', name: 'PPR union 3/4"', unit: 'pc', cost: 50, price: 80, reorder: 1, sold: 2 },
  { cat: 'cat_plumbing', name: 'Teflon tape', unit: 'pc', cost: 110, price: 150, reorder: 5, sold: 20 },
  { cat: 'cat_plumbing', name: 'Water hose 1/2" (m)', unit: 'm', cost: 60, price: 80, reorder: 10, sold: 40 },
  { cat: 'cat_plumbing', name: 'Water hose 3/4" (m)', unit: 'm', cost: 75, price: 100, reorder: 3, sold: 12 },

  // Tools & welding
  { cat: 'cat_tools', name: 'C-clamp 3/4', unit: 'pc', cost: 190, price: 250, reorder: 1, sold: 1 },
  { cat: 'cat_tools', name: 'Chisel (chira)', unit: 'pc', cost: 55, price: 75, reorder: 6, sold: 23, needsChecking: true },
  { cat: 'cat_tools', name: 'Cutter blade 5"', unit: 'pc', cost: 110, price: 150, reorder: 3, sold: 12 },
  { cat: 'cat_tools', name: 'Cutter blade 7" Sali', unit: 'pc', cost: 150, price: 200, reorder: 3, sold: 9 },
  { cat: 'cat_tools', name: 'Cutter blade 9"', unit: 'pc', cost: 260, price: 350, reorder: 3, sold: 12 },
  { cat: 'cat_tools', name: 'Cutting disc Tafen', unit: 'pc', cost: 500, price: 650, reorder: 3, sold: 10 },
  { cat: 'cat_tools', name: 'Grinding disc', unit: 'pc', cost: 350, price: 450, reorder: 3, sold: 10 },
  { cat: 'cat_tools', name: 'Measuring tape 5m', unit: 'pc', cost: 300, price: 400, reorder: 4, sold: 14, needsChecking: true },
  { cat: 'cat_tools', name: 'Punta drill bit 10"', unit: 'pc', cost: 230, price: 300, reorder: 1, sold: 3 },
  { cat: 'cat_tools', name: 'Shooter 3"', unit: 'pc', cost: 480, price: 600, reorder: 3, sold: 12, needsChecking: true },
  { cat: 'cat_tools', name: 'Shooter 4"', unit: 'pc', cost: 800, price: 1000, reorder: 2, sold: 7, needsChecking: true },
  { cat: 'cat_tools', name: 'Staples 10/13 box', unit: 'box', cost: 310, price: 500, reorder: 5, sold: 19 },
  { cat: 'cat_tools', name: 'Welding electrode (pack)', unit: 'pc', cost: 880, price: 1000, reorder: 3, sold: 12 },

  // Locks, hinges & handles
  { cat: 'cat_locks', name: 'Cobra cylinder lock', unit: 'pc', cost: 260, price: 400, reorder: 2, sold: 8 },
  { cat: 'cat_locks', name: 'Cobra key lock', unit: 'pc', cost: 1300, price: 1475, reorder: 4, sold: 13 },
  { cat: 'cat_locks', name: 'Handle (mankiya) 20"', unit: 'pc', cost: 190, price: 250, reorder: 1, sold: 4 },
  { cat: 'cat_locks', name: 'Hinge Oxford', unit: 'pc', cost: 95, price: 125, reorder: 2, sold: 8, needsChecking: true },

  // Decorative (ejeta circles)
  { cat: 'cat_decorative', name: 'Ejeta 15cm', unit: 'pc', cost: 63, price: 75, reorder: 10, sold: 41, needsChecking: true },
  { cat: 'cat_decorative', name: 'Ejeta black 15cm', unit: 'pc', cost: 38, price: 50, reorder: 1, sold: 4 },
  { cat: 'cat_decorative', name: 'Ejeta black circle', unit: 'pc', cost: 26, price: 50, reorder: 1, sold: 2 },
  { cat: 'cat_decorative', name: 'Ejeta gold', unit: 'pc', cost: 30, price: 40, reorder: 3, sold: 12, needsChecking: true },
  { cat: 'cat_decorative', name: 'Ejeta gold 20cm', unit: 'pc', cost: 72, price: 90, reorder: 5, sold: 21 },
  { cat: 'cat_decorative', name: 'Ejeta gold circle', unit: 'pc', cost: 26, price: 50, reorder: 17, sold: 70 },
  { cat: 'cat_decorative', name: 'Ejeta silver 15cm', unit: 'pc', cost: 37, price: 50, reorder: 18, sold: 75 },
  { cat: 'cat_decorative', name: 'Ejeta silver 20cm', unit: 'pc', cost: 68, price: 90, reorder: 1, sold: 3 },

  // Other hardware
  { cat: 'cat_other', name: 'Bica afer (Red pigment)', unit: 'kg', cost: 380, price: 500, reorder: 2, sold: 6, needsChecking: true },
  { cat: 'cat_other', name: 'Cricketo', unit: 'pc', cost: 38, price: 50, reorder: 3, sold: 10, needsChecking: true },
  { cat: 'cat_other', name: 'Cricketo (box)', unit: 'box', cost: 380, price: 500, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_other', name: 'D-FIL', unit: 'pc', cost: 110, price: 150, reorder: 5, sold: 21, needsChecking: true },
  { cat: 'cat_other', name: 'Efer gold pigment', unit: 'pc', cost: 270, price: 350, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_other', name: 'Key afer (Brown pigment)', unit: 'kg', cost: 380, price: 500, reorder: 2, sold: 4, needsChecking: true },
  { cat: 'cat_other', name: 'Lastro plastic sheet', unit: 'pc', cost: 85, price: 100, reorder: 6, sold: 25, needsChecking: true },
  { cat: 'cat_other', name: 'Madish Oma 1kg', unit: 'pc', cost: 460, price: 600, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_other', name: 'SFL (box)', unit: 'box', cost: 680, price: 850, reorder: 4, sold: 13, needsChecking: true },
  { cat: 'cat_other', name: 'Sibago tying cord', unit: 'pc', cost: 110, price: 150, reorder: 4, sold: 16, needsChecking: true },
  { cat: 'cat_other', name: 'TVP adhesive', unit: 'pc', cost: 101, price: 120, reorder: 13, sold: 54, needsChecking: true },

  // Needs naming items (Real audit ledger items from memos & photos)
  { cat: 'cat_needs_naming', name: '2C 17 · memo 09/22 line 35', unit: 'pc', cost: 1850, price: 2150, reorder: 1, sold: 0, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Fine mineral powder · book 10/14', unit: 'kg', cost: 800, price: 1000, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Amharic item · photo 1530 line 17', unit: 'pc', cost: 95, price: 120, reorder: 1, sold: 4, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Amharic item · photo 1533 line 4', unit: 'pc', cost: 10, price: 15, reorder: 4, sold: 15, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Coarse sand pigment · photo 1505', unit: 'kg', cost: 110, price: 150, reorder: 1, sold: 2, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Hardware fitting · photo 1540', unit: 'pc', cost: 120, price: 150, reorder: 1, sold: 2, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Decorative molding item · photo 1530', unit: 'pc', cost: 200, price: 250, reorder: 1, sold: 2, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Fine colored aggregate · photo 1525', unit: 'kg', cost: 240, price: 300, reorder: 1, sold: 3, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Galon liquid container · photo 1482', unit: 'gallon', cost: 4100, price: 4800, reorder: 1, sold: 1, needsChecking: true },
  { cat: 'cat_needs_naming', name: 'Golden decorative trim · photo 1533', unit: 'pc', cost: 45, price: 60, reorder: 3, sold: 12, needsChecking: true },
];

export function generateChercherProducts(): Product[] {
  return RAW_CHERCHER_DATA.map((item, index) => {
    // Determine realistic initial in-store quantity based on reorder threshold and monthly sales
    // If sold > 0, keep a realistic healthy or low stock level
    let quantity = Math.max(1, Math.round(item.reorder * 3 + item.sold * 0.5));
    // Intentionally let a few items be low stock (below reorder threshold) to demonstrate live reorder alerts!
    if (index % 7 === 0) {
      quantity = Math.max(0, item.reorder - 1);
    }

    const code = `CHR-${item.cat.replace('cat_', '').substring(0, 3).toUpperCase()}-${String(index + 101).padStart(3, '0')}`;
    const costPrice = item.cost || Math.round(item.price * 0.82);

    return {
      id: `prod_chr_${index + 1}`,
      code,
      name: item.name,
      categoryId: item.cat,
      brand: item.name.includes('Panda')
        ? 'Panda'
        : item.name.includes('Jet')
          ? 'Jet'
          : item.name.includes('Nifas Silk')
            ? 'Nifas Silk'
            : item.name.includes('Rodas')
              ? 'Rodas'
              : item.name.includes('CHNT')
                ? 'CHNT'
                : item.name.includes('Cobra')
                  ? 'Cobra'
                  : 'Chercher Standard',
      unit: item.unit,
      purchasePrice: costPrice,
      sellingPrice: item.price,
      quantity,
      minThreshold: item.reorder,
      supplierId: 'sup_dangote',
      barcode: `690${String(1000000 + index).padStart(7, '0')}`,
      description: item.needsChecking
        ? 'Item name marked for store physical audit review.'
        : `Building hardware & material catalogued for Chercher Retail Shop.`,
      needsChecking: item.needsChecking,
      soldIn30Days: item.sold,
    };
  });
}
