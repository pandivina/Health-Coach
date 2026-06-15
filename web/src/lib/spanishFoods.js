// ─── lib/spanishFoods.js ──────────────────────────────────────────────────────
// Base de datos local de ~250 alimentos españoles más comunes
// Búsqueda instantánea sin API — datos por 100g
// Fuentes: BEDCA, AESAN, tablas de composición de alimentos españoles

export const SPANISH_FOODS = [
  // ── CARNES ────────────────────────────────────────────────────────────────
  { food_name:'Pollo a la plancha',          calories_per_100g:165, protein_per_100g:31,  carbs_per_100g:0,   fat_per_100g:3.6,  emoji:'🍗', category:'carnes' },
  { food_name:'Pechuga de pollo cocida',     calories_per_100g:158, protein_per_100g:32,  carbs_per_100g:0,   fat_per_100g:2.8,  emoji:'🍗', category:'carnes' },
  { food_name:'Muslo de pollo asado',        calories_per_100g:209, protein_per_100g:25,  carbs_per_100g:0,   fat_per_100g:11,   emoji:'🍗', category:'carnes' },
  { food_name:'Ternera a la plancha',        calories_per_100g:185, protein_per_100g:28,  carbs_per_100g:0,   fat_per_100g:7.5,  emoji:'🥩', category:'carnes' },
  { food_name:'Filete de ternera',           calories_per_100g:179, protein_per_100g:29,  carbs_per_100g:0,   fat_per_100g:6.2,  emoji:'🥩', category:'carnes' },
  { food_name:'Carne picada de ternera',     calories_per_100g:198, protein_per_100g:26,  carbs_per_100g:0,   fat_per_100g:10,   emoji:'🥩', category:'carnes' },
  { food_name:'Lomo de cerdo a la plancha',  calories_per_100g:195, protein_per_100g:27,  carbs_per_100g:0,   fat_per_100g:9.5,  emoji:'🥩', category:'carnes' },
  { food_name:'Chuleta de cerdo',            calories_per_100g:215, protein_per_100g:25,  carbs_per_100g:0,   fat_per_100g:12,   emoji:'🥩', category:'carnes' },
  { food_name:'Jamón serrano',               calories_per_100g:241, protein_per_100g:30,  carbs_per_100g:0.5, fat_per_100g:13,   emoji:'🥓', category:'carnes' },
  { food_name:'Jamón york (cocido)',         calories_per_100g:107, protein_per_100g:16,  carbs_per_100g:1.5, fat_per_100g:4.2,  emoji:'🥓', category:'carnes' },
  { food_name:'Pavo a la plancha',           calories_per_100g:157, protein_per_100g:30,  carbs_per_100g:0,   fat_per_100g:3.5,  emoji:'🦃', category:'carnes' },
  { food_name:'Salchichón',                  calories_per_100g:380, protein_per_100g:22,  carbs_per_100g:2,   fat_per_100g:32,   emoji:'🌭', category:'carnes' },
  { food_name:'Chorizo',                     calories_per_100g:455, protein_per_100g:24,  carbs_per_100g:2,   fat_per_100g:40,   emoji:'🌭', category:'carnes' },
  { food_name:'Morcilla',                    calories_per_100g:299, protein_per_100g:12,  carbs_per_100g:15,  fat_per_100g:22,   emoji:'🌭', category:'carnes' },
  { food_name:'Conejo guisado',              calories_per_100g:162, protein_per_100g:28,  carbs_per_100g:0,   fat_per_100g:5,    emoji:'🐰', category:'carnes' },

  // ── PESCADOS ──────────────────────────────────────────────────────────────
  { food_name:'Merluza a la plancha',        calories_per_100g:86,  protein_per_100g:17,  carbs_per_100g:0,   fat_per_100g:1.8,  emoji:'🐟', category:'pescados' },
  { food_name:'Salmón a la plancha',         calories_per_100g:208, protein_per_100g:25,  carbs_per_100g:0,   fat_per_100g:11,   emoji:'🐟', category:'pescados' },
  { food_name:'Atún en lata (agua)',         calories_per_100g:116, protein_per_100g:26,  carbs_per_100g:0,   fat_per_100g:1,    emoji:'🐟', category:'pescados' },
  { food_name:'Atún en lata (aceite)',       calories_per_100g:198, protein_per_100g:25,  carbs_per_100g:0,   fat_per_100g:11,   emoji:'🐟', category:'pescados' },
  { food_name:'Sardinas en lata',            calories_per_100g:208, protein_per_100g:25,  carbs_per_100g:0,   fat_per_100g:11,   emoji:'🐟', category:'pescados' },
  { food_name:'Bacalao a la plancha',        calories_per_100g:82,  protein_per_100g:18,  carbs_per_100g:0,   fat_per_100g:0.7,  emoji:'🐟', category:'pescados' },
  { food_name:'Dorada al horno',             calories_per_100g:96,  protein_per_100g:20,  carbs_per_100g:0,   fat_per_100g:1.9,  emoji:'🐟', category:'pescados' },
  { food_name:'Lubina al horno',             calories_per_100g:97,  protein_per_100g:19,  carbs_per_100g:0,   fat_per_100g:2.2,  emoji:'🐟', category:'pescados' },
  { food_name:'Boquerones en vinagre',       calories_per_100g:131, protein_per_100g:20,  carbs_per_100g:0,   fat_per_100g:5.4,  emoji:'🐟', category:'pescados' },
  { food_name:'Gambas a la plancha',         calories_per_100g:85,  protein_per_100g:18,  carbs_per_100g:0.5, fat_per_100g:1,    emoji:'🦐', category:'pescados' },
  { food_name:'Mejillones al vapor',         calories_per_100g:86,  protein_per_100g:12,  carbs_per_100g:3.4, fat_per_100g:2.2,  emoji:'🦪', category:'pescados' },
  { food_name:'Calamares a la romana',       calories_per_100g:175, protein_per_100g:15,  carbs_per_100g:12,  fat_per_100g:7,    emoji:'🦑', category:'pescados' },
  { food_name:'Pulpo cocido',                calories_per_100g:82,  protein_per_100g:15,  carbs_per_100g:2.2, fat_per_100g:1,    emoji:'🐙', category:'pescados' },

  // ── HUEVOS Y LÁCTEOS ──────────────────────────────────────────────────────
  { food_name:'Huevo entero',                calories_per_100g:143, protein_per_100g:13,  carbs_per_100g:0.7, fat_per_100g:9.5,  emoji:'🥚', category:'huevos' },
  { food_name:'Clara de huevo',              calories_per_100g:52,  protein_per_100g:11,  carbs_per_100g:0.7, fat_per_100g:0.2,  emoji:'🥚', category:'huevos' },
  { food_name:'Huevo frito',                 calories_per_100g:196, protein_per_100g:14,  carbs_per_100g:0.4, fat_per_100g:15,   emoji:'🍳', category:'huevos' },
  { food_name:'Tortilla española',           calories_per_100g:185, protein_per_100g:10,  carbs_per_100g:14,  fat_per_100g:9.5,  emoji:'🥚', category:'huevos' },
  { food_name:'Leche entera',                calories_per_100g:65,  protein_per_100g:3.2, carbs_per_100g:4.8, fat_per_100g:3.7,  emoji:'🥛', category:'lacteos' },
  { food_name:'Leche semidesnatada',         calories_per_100g:46,  protein_per_100g:3.3, carbs_per_100g:4.9, fat_per_100g:1.6,  emoji:'🥛', category:'lacteos' },
  { food_name:'Leche desnatada',             calories_per_100g:35,  protein_per_100g:3.4, carbs_per_100g:5,   fat_per_100g:0.1,  emoji:'🥛', category:'lacteos' },
  { food_name:'Yogur natural',               calories_per_100g:61,  protein_per_100g:3.8, carbs_per_100g:4.7, fat_per_100g:3.3,  emoji:'🥛', category:'lacteos' },
  { food_name:'Yogur griego',                calories_per_100g:97,  protein_per_100g:9,   carbs_per_100g:3.6, fat_per_100g:5,    emoji:'🥛', category:'lacteos' },
  { food_name:'Yogur desnatado',             calories_per_100g:40,  protein_per_100g:3.9, carbs_per_100g:5.3, fat_per_100g:0.2,  emoji:'🥛', category:'lacteos' },
  { food_name:'Queso manchego',              calories_per_100g:391, protein_per_100g:28,  carbs_per_100g:0.5, fat_per_100g:32,   emoji:'🧀', category:'lacteos' },
  { food_name:'Queso fresco',                calories_per_100g:98,  protein_per_100g:11,  carbs_per_100g:3.5, fat_per_100g:4.5,  emoji:'🧀', category:'lacteos' },
  { food_name:'Queso cottage',               calories_per_100g:98,  protein_per_100g:11,  carbs_per_100g:3.4, fat_per_100g:4.3,  emoji:'🧀', category:'lacteos' },
  { food_name:'Requesón',                    calories_per_100g:96,  protein_per_100g:10,  carbs_per_100g:4,   fat_per_100g:4,    emoji:'🧀', category:'lacteos' },
  { food_name:'Queso mozzarella',            calories_per_100g:280, protein_per_100g:22,  carbs_per_100g:2.2, fat_per_100g:20,   emoji:'🧀', category:'lacteos' },

  // ── CEREALES Y PAN ────────────────────────────────────────────────────────
  { food_name:'Arroz blanco cocido',         calories_per_100g:130, protein_per_100g:2.7, carbs_per_100g:28,  fat_per_100g:0.3,  emoji:'🍚', category:'cereales' },
  { food_name:'Arroz integral cocido',       calories_per_100g:111, protein_per_100g:2.6, carbs_per_100g:23,  fat_per_100g:0.9,  emoji:'🍚', category:'cereales' },
  { food_name:'Pasta cocida (espaguetis)',   calories_per_100g:131, protein_per_100g:5,   carbs_per_100g:25,  fat_per_100g:1.1,  emoji:'🍝', category:'cereales' },
  { food_name:'Pasta integral cocida',       calories_per_100g:124, protein_per_100g:5.3, carbs_per_100g:23,  fat_per_100g:1,    emoji:'🍝', category:'cereales' },
  { food_name:'Pan blanco',                  calories_per_100g:265, protein_per_100g:8,   carbs_per_100g:50,  fat_per_100g:3.2,  emoji:'🍞', category:'cereales' },
  { food_name:'Pan integral',                calories_per_100g:247, protein_per_100g:9,   carbs_per_100g:44,  fat_per_100g:3.4,  emoji:'🍞', category:'cereales' },
  { food_name:'Pan de molde blanco',         calories_per_100g:266, protein_per_100g:8,   carbs_per_100g:49,  fat_per_100g:3.5,  emoji:'🍞', category:'cereales' },
  { food_name:'Tostada de pan (1 rebanada)', calories_per_100g:270, protein_per_100g:8.5, carbs_per_100g:51,  fat_per_100g:3.4,  emoji:'🍞', category:'cereales' },
  { food_name:'Avena (copos)',               calories_per_100g:368, protein_per_100g:13,  carbs_per_100g:58,  fat_per_100g:7,    emoji:'🥣', category:'cereales' },
  { food_name:'Avena cocida (porridge)',     calories_per_100g:71,  protein_per_100g:2.5, carbs_per_100g:12,  fat_per_100g:1.5,  emoji:'🥣', category:'cereales' },
  { food_name:'Quinoa cocida',               calories_per_100g:120, protein_per_100g:4.4, carbs_per_100g:21,  fat_per_100g:1.9,  emoji:'🌾', category:'cereales' },
  { food_name:'Maíz cocido',                 calories_per_100g:96,  protein_per_100g:3.4, carbs_per_100g:19,  fat_per_100g:1.5,  emoji:'🌽', category:'cereales' },

  // ── LEGUMBRES ─────────────────────────────────────────────────────────────
  { food_name:'Lentejas cocidas',            calories_per_100g:116, protein_per_100g:9,   carbs_per_100g:20,  fat_per_100g:0.4,  emoji:'🫘', category:'legumbres' },
  { food_name:'Garbanzos cocidos',           calories_per_100g:164, protein_per_100g:9,   carbs_per_100g:27,  fat_per_100g:2.6,  emoji:'🫘', category:'legumbres' },
  { food_name:'Alubias blancas cocidas',     calories_per_100g:127, protein_per_100g:9,   carbs_per_100g:22,  fat_per_100g:0.5,  emoji:'🫘', category:'legumbres' },
  { food_name:'Alubias negras cocidas',      calories_per_100g:132, protein_per_100g:9,   carbs_per_100g:24,  fat_per_100g:0.5,  emoji:'🫘', category:'legumbres' },
  { food_name:'Edamame cocido',              calories_per_100g:121, protein_per_100g:11,  carbs_per_100g:8.9, fat_per_100g:5.2,  emoji:'🫘', category:'legumbres' },
  { food_name:'Tofu firme',                  calories_per_100g:76,  protein_per_100g:8,   carbs_per_100g:1.9, fat_per_100g:4.2,  emoji:'🫘', category:'legumbres' },

  // ── VERDURAS ──────────────────────────────────────────────────────────────
  { food_name:'Brócoli cocido',              calories_per_100g:35,  protein_per_100g:2.4, carbs_per_100g:7.2, fat_per_100g:0.4,  emoji:'🥦', category:'verduras' },
  { food_name:'Espinacas cocidas',           calories_per_100g:23,  protein_per_100g:3,   carbs_per_100g:3.6, fat_per_100g:0.3,  emoji:'🥬', category:'verduras' },
  { food_name:'Ensalada mixta',              calories_per_100g:18,  protein_per_100g:1.2, carbs_per_100g:3,   fat_per_100g:0.2,  emoji:'🥗', category:'verduras' },
  { food_name:'Tomate',                      calories_per_100g:18,  protein_per_100g:0.9, carbs_per_100g:3.9, fat_per_100g:0.2,  emoji:'🍅', category:'verduras' },
  { food_name:'Pepino',                      calories_per_100g:16,  protein_per_100g:0.7, carbs_per_100g:3.6, fat_per_100g:0.1,  emoji:'🥒', category:'verduras' },
  { food_name:'Zanahoria cruda',             calories_per_100g:41,  protein_per_100g:0.9, carbs_per_100g:10,  fat_per_100g:0.2,  emoji:'🥕', category:'verduras' },
  { food_name:'Pimiento rojo',               calories_per_100g:31,  protein_per_100g:1,   carbs_per_100g:7,   fat_per_100g:0.3,  emoji:'🫑', category:'verduras' },
  { food_name:'Pimiento verde',              calories_per_100g:20,  protein_per_100g:0.9, carbs_per_100g:4.6, fat_per_100g:0.2,  emoji:'🫑', category:'verduras' },
  { food_name:'Cebolla',                     calories_per_100g:40,  protein_per_100g:1.1, carbs_per_100g:9.3, fat_per_100g:0.1,  emoji:'🧅', category:'verduras' },
  { food_name:'Ajo',                         calories_per_100g:149, protein_per_100g:6.4, carbs_per_100g:33,  fat_per_100g:0.5,  emoji:'🧄', category:'verduras' },
  { food_name:'Patata cocida',               calories_per_100g:86,  protein_per_100g:1.9, carbs_per_100g:20,  fat_per_100g:0.1,  emoji:'🥔', category:'verduras' },
  { food_name:'Patata asada',                calories_per_100g:93,  protein_per_100g:2.5, carbs_per_100g:21,  fat_per_100g:0.1,  emoji:'🥔', category:'verduras' },
  { food_name:'Boniato cocido',              calories_per_100g:90,  protein_per_100g:2,   carbs_per_100g:21,  fat_per_100g:0.1,  emoji:'🍠', category:'verduras' },
  { food_name:'Calabacín cocido',            calories_per_100g:17,  protein_per_100g:1.2, carbs_per_100g:3.4, fat_per_100g:0.2,  emoji:'🥒', category:'verduras' },
  { food_name:'Berenjena asada',             calories_per_100g:33,  protein_per_100g:0.9, carbs_per_100g:8.7, fat_per_100g:0.2,  emoji:'🍆', category:'verduras' },
  { food_name:'Alcachofas cocidas',          calories_per_100g:53,  protein_per_100g:2.9, carbs_per_100g:10,  fat_per_100g:0.3,  emoji:'🌿', category:'verduras' },
  { food_name:'Judías verdes cocidas',       calories_per_100g:35,  protein_per_100g:2,   carbs_per_100g:7.9, fat_per_100g:0.2,  emoji:'🫛', category:'verduras' },
  { food_name:'Coliflor cocida',             calories_per_100g:25,  protein_per_100g:2,   carbs_per_100g:5,   fat_per_100g:0.3,  emoji:'🥦', category:'verduras' },
  { food_name:'Champiñones salteados',       calories_per_100g:28,  protein_per_100g:2.5, carbs_per_100g:5.3, fat_per_100g:0.4,  emoji:'🍄', category:'verduras' },
  { food_name:'Espárragos a la plancha',     calories_per_100g:24,  protein_per_100g:2.5, carbs_per_100g:4.5, fat_per_100g:0.1,  emoji:'🌿', category:'verduras' },
  { food_name:'Aguacate',                    calories_per_100g:160, protein_per_100g:2,   carbs_per_100g:9,   fat_per_100g:15,   emoji:'🥑', category:'verduras' },

  // ── FRUTAS ────────────────────────────────────────────────────────────────
  { food_name:'Manzana',                     calories_per_100g:52,  protein_per_100g:0.3, carbs_per_100g:14,  fat_per_100g:0.2,  emoji:'🍎', category:'frutas' },
  { food_name:'Plátano',                     calories_per_100g:89,  protein_per_100g:1.1, carbs_per_100g:23,  fat_per_100g:0.3,  emoji:'🍌', category:'frutas' },
  { food_name:'Naranja',                     calories_per_100g:47,  protein_per_100g:0.9, carbs_per_100g:12,  fat_per_100g:0.1,  emoji:'🍊', category:'frutas' },
  { food_name:'Fresa',                       calories_per_100g:32,  protein_per_100g:0.7, carbs_per_100g:7.7, fat_per_100g:0.3,  emoji:'🍓', category:'frutas' },
  { food_name:'Uvas',                        calories_per_100g:69,  protein_per_100g:0.7, carbs_per_100g:18,  fat_per_100g:0.2,  emoji:'🍇', category:'frutas' },
  { food_name:'Sandía',                      calories_per_100g:30,  protein_per_100g:0.6, carbs_per_100g:7.6, fat_per_100g:0.2,  emoji:'🍉', category:'frutas' },
  { food_name:'Melón',                       calories_per_100g:34,  protein_per_100g:0.8, carbs_per_100g:8.2, fat_per_100g:0.2,  emoji:'🍈', category:'frutas' },
  { food_name:'Pera',                        calories_per_100g:57,  protein_per_100g:0.4, carbs_per_100g:15,  fat_per_100g:0.1,  emoji:'🍐', category:'frutas' },
  { food_name:'Melocotón',                   calories_per_100g:39,  protein_per_100g:0.9, carbs_per_100g:10,  fat_per_100g:0.3,  emoji:'🍑', category:'frutas' },
  { food_name:'Kiwi',                        calories_per_100g:61,  protein_per_100g:1.1, carbs_per_100g:15,  fat_per_100g:0.5,  emoji:'🥝', category:'frutas' },
  { food_name:'Mango',                       calories_per_100g:60,  protein_per_100g:0.8, carbs_per_100g:15,  fat_per_100g:0.4,  emoji:'🥭', category:'frutas' },
  { food_name:'Piña',                        calories_per_100g:50,  protein_per_100g:0.5, carbs_per_100g:13,  fat_per_100g:0.1,  emoji:'🍍', category:'frutas' },
  { food_name:'Arándanos',                   calories_per_100g:57,  protein_per_100g:0.7, carbs_per_100g:14,  fat_per_100g:0.3,  emoji:'🫐', category:'frutas' },
  { food_name:'Cerezas',                     calories_per_100g:63,  protein_per_100g:1.1, carbs_per_100g:16,  fat_per_100g:0.2,  emoji:'🍒', category:'frutas' },
  { food_name:'Higos',                       calories_per_100g:74,  protein_per_100g:0.8, carbs_per_100g:19,  fat_per_100g:0.3,  emoji:'🍈', category:'frutas' },

  // ── FRUTOS SECOS Y SEMILLAS ───────────────────────────────────────────────
  { food_name:'Almendras',                   calories_per_100g:579, protein_per_100g:21,  carbs_per_100g:22,  fat_per_100g:50,   emoji:'🌰', category:'frutos_secos' },
  { food_name:'Nueces',                      calories_per_100g:654, protein_per_100g:15,  carbs_per_100g:14,  fat_per_100g:65,   emoji:'🌰', category:'frutos_secos' },
  { food_name:'Cacahuetes',                  calories_per_100g:567, protein_per_100g:26,  carbs_per_100g:16,  fat_per_100g:49,   emoji:'🥜', category:'frutos_secos' },
  { food_name:'Anacardos',                   calories_per_100g:553, protein_per_100g:18,  carbs_per_100g:30,  fat_per_100g:44,   emoji:'🌰', category:'frutos_secos' },
  { food_name:'Pipas de girasol',            calories_per_100g:584, protein_per_100g:21,  carbs_per_100g:20,  fat_per_100g:51,   emoji:'🌻', category:'frutos_secos' },
  { food_name:'Semillas de chía',            calories_per_100g:486, protein_per_100g:17,  carbs_per_100g:42,  fat_per_100g:31,   emoji:'🌱', category:'frutos_secos' },
  { food_name:'Mantequilla de cacahuete',    calories_per_100g:588, protein_per_100g:25,  carbs_per_100g:20,  fat_per_100g:50,   emoji:'🥜', category:'frutos_secos' },

  // ── GRASAS Y ACEITES ─────────────────────────────────────────────────────
  { food_name:'Aceite de oliva virgen extra', calories_per_100g:884, protein_per_100g:0,  carbs_per_100g:0,   fat_per_100g:100,  emoji:'🫒', category:'grasas' },
  { food_name:'Mantequilla',                 calories_per_100g:717, protein_per_100g:0.9, carbs_per_100g:0.1, fat_per_100g:81,   emoji:'🧈', category:'grasas' },

  // ── BEBIDAS ───────────────────────────────────────────────────────────────
  { food_name:'Leche de avena',              calories_per_100g:47,  protein_per_100g:1.1, carbs_per_100g:8.8, fat_per_100g:1.3,  emoji:'🥛', category:'bebidas' },
  { food_name:'Leche de almendras',          calories_per_100g:24,  protein_per_100g:0.7, carbs_per_100g:2.6, fat_per_100g:1.3,  emoji:'🥛', category:'bebidas' },
  { food_name:'Zumo de naranja natural',     calories_per_100g:45,  protein_per_100g:0.7, carbs_per_100g:10,  fat_per_100g:0.2,  emoji:'🍊', category:'bebidas' },
  { food_name:'Café con leche (100ml)',      calories_per_100g:38,  protein_per_100g:1.9, carbs_per_100g:3.6, fat_per_100g:1.7,  emoji:'☕', category:'bebidas' },
  { food_name:'Batido de proteínas',         calories_per_100g:110, protein_per_100g:20,  carbs_per_100g:5,   fat_per_100g:2,    emoji:'🥤', category:'bebidas' },

  // ── PLATOS TÍPICOS ESPAÑOLES ──────────────────────────────────────────────
  { food_name:'Paella de pollo (ración)',    calories_per_100g:162, protein_per_100g:8,   carbs_per_100g:22,  fat_per_100g:4.5,  emoji:'🥘', category:'platos' },
  { food_name:'Cocido madrileño (ración)',   calories_per_100g:198, protein_per_100g:14,  carbs_per_100g:18,  fat_per_100g:7,    emoji:'🍲', category:'platos' },
  { food_name:'Gazpacho',                    calories_per_100g:50,  protein_per_100g:1.2, carbs_per_100g:9,   fat_per_100g:1.3,  emoji:'🍵', category:'platos' },
  { food_name:'Salmorejo',                   calories_per_100g:100, protein_per_100g:2.5, carbs_per_100g:14,  fat_per_100g:4,    emoji:'🍵', category:'platos' },
  { food_name:'Croquetas (1 unidad)',        calories_per_100g:220, protein_per_100g:8,   carbs_per_100g:18,  fat_per_100g:12,   emoji:'🍘', category:'platos' },
  { food_name:'Ensaladilla rusa',            calories_per_100g:140, protein_per_100g:4,   carbs_per_100g:12,  fat_per_100g:8,    emoji:'🥗', category:'platos' },

  // ── PROTEÍNA DEPORTIVA ────────────────────────────────────────────────────
  { food_name:'Proteína whey (polvo)',       calories_per_100g:380, protein_per_100g:80,  carbs_per_100g:7,   fat_per_100g:5,    emoji:'💪', category:'suplementos' },
  { food_name:'Creatina (polvo)',            calories_per_100g:0,   protein_per_100g:0,   carbs_per_100g:0,   fat_per_100g:0,    emoji:'💪', category:'suplementos' },
]

// ─── BÚSQUEDA LOCAL ───────────────────────────────────────────────────────────

const NORMALIZED = SPANISH_FOODS.map(f => ({
  ...f,
  _search: f.food_name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // quitar acentos
    .replace(/[^a-z0-9\s]/g, '')
}))

export function searchLocal(query) {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()

  const terms = q.split(' ').filter(Boolean)

  return NORMALIZED
    .filter(f => terms.every(t => f._search.includes(t)))
    .sort((a, b) => {
      // Priorizar coincidencia al inicio del nombre
      const aStart = a._search.startsWith(q) ? 0 : 1
      const bStart = b._search.startsWith(q) ? 0 : 1
      return aStart - bStart || a.food_name.length - b.food_name.length
    })
    .slice(0, 12)
}

// Categorías para mostrar sugerencias iniciales
export const FOOD_CATEGORIES = [
  { id:'carnes',       label:'Carnes',        emoji:'🥩' },
  { id:'pescados',     label:'Pescados',       emoji:'🐟' },
  { id:'huevos',       label:'Huevos',         emoji:'🥚' },
  { id:'lacteos',      label:'Lácteos',        emoji:'🥛' },
  { id:'cereales',     label:'Cereales',       emoji:'🍚' },
  { id:'legumbres',    label:'Legumbres',      emoji:'🫘' },
  { id:'verduras',     label:'Verduras',       emoji:'🥦' },
  { id:'frutas',       label:'Frutas',         emoji:'🍎' },
  { id:'frutos_secos', label:'Frutos secos',   emoji:'🌰' },
  { id:'platos',       label:'Platos típicos', emoji:'🥘' },
]

export function getFoodsByCategory(category) {
  return SPANISH_FOODS.filter(f => f.category === category)
}
