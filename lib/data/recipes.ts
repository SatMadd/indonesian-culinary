import { Recipe } from '@/types';

export const FALLBACK_RECIPES: Recipe[] = [
  {
    title: 'Soto Ayam',
    slug: 'soto-ayam',
    description: 'Soto ayam hangat dengan kuah kuning yang gurih, taburan koya, seledri, dan perasan jeruk nipis.',
    image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
    region: 'Jawa',
    prep_time: 20,
    cook_time: 40,
    servings: 4,
    ingredients: [
      '500 gram ayam kampung, potong 4 bagian',
      '2 liter air',
      '2 batang serai, memarkan',
      '3 lembar daun jeruk',
      '2 lembar daun salam',
      '2 batang daun bawang, iris kasar',
      'Bumbu Halus: 8 butir bawang merah, 5 siung bawang putih, 4 butir kemiri, 2 cm kunyit bakar, 2 cm jahe, 1 sdt ketumbar, 1/2 sdt merica bubuk',
      'Bahan Pelengkap: soun seduh, kol iris tipis, telur rebus, seledri iris, bawang goreng, koya'
    ],
    steps: [
      'Rebus ayam dalam air bersama daun salam dan serai hingga daging ayam empuk.',
      'Tumis bumbu halus bersama daun jeruk hingga harum dan matang.',
      'Masukkan tumisan bumbu ke dalam kuah rebusan ayam. Tambahkan garam, merica, dan gula secukupnya.',
      'Keluarkan ayam dari kuah, tiriskan, lalu goreng sebentar hingga kecokelatan. Suwir-suwir daging ayam.',
      'Tata bahan pelengkap dan suwiran ayam di dalam mangkuk saji.',
      'Siram dengan kuah soto panas-panas. Taburi dengan bawang goreng, seledri, dan sajikan bersama jeruk nipis.'
    ],
    is_popular: true,
    difficulty: 'mudah'
  },
  {
    title: 'Ayam Kecap',
    slug: 'ayam-kecap',
    description: 'Ayam kecap manis gurih dengan saus kental yang meresap sempurna, cocok untuk menu harian keluarga.',
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?w=800&auto=format&fit=crop&q=80',
    region: 'Sunda',
    prep_time: 15,
    cook_time: 25,
    servings: 4,
    ingredients: [
      '500 gram ayam, potong sesuai selera',
      '5 sdm kecap manis',
      '1 buah bawang bombay, iris memanjang',
      '3 siung bawang putih, cincang halus',
      '2 cm jahe, memarkan',
      '2 batang daun bawang, iris serong',
      '1 sdt garam',
      '1/2 sdt merica bubuk',
      '150 ml air',
      'Minyak secukupnya untuk menggoreng'
    ],
    steps: [
      'Lumuri ayam dengan garam dan merica bubuk, diamkan selama 10 menit.',
      'Goreng ayam hingga setengah matang atau berkulit kecokelatan, lalu tiriskan.',
      'Tumis bawang putih dan jahe hingga harum, lalu masukkan bawang bombay dan tumis hingga layu.',
      'Masukkan ayam goreng, kecap manis, garam, merica bubuk, dan aduk rata.',
      'Tuangkan air, masak dengan api sedang hingga kuah menyusut dan bumbu meresap sempurna.',
      'Masukkan daun bawang sesaat sebelum diangkat, aduk sebentar, lalu sajikan hangat.'
    ],
    is_popular: true,
    difficulty: 'mudah'
  },
  {
    title: 'Rendang Daging',
    slug: 'rendang-daging',
    description: 'Rendang daging sapi khas Minangkabau yang kaya akan rempah-rempah asli dan dimasak perlahan hingga kering kecokelatan.',
    image_url: 'https://images.unsplash.com/photo-1626804475315-9644b37a2fe4?w=800&auto=format&fit=crop&q=80',
    region: 'Padang',
    prep_time: 30,
    cook_time: 180,
    servings: 6,
    ingredients: [
      '1 kg daging sapi khas luar, potong dadu agak besar',
      '1.000 ml santan kental dari 3 butir kelapa',
      '1.000 ml santan encer',
      '2 batang serai, memarkan',
      '4 lembar daun jeruk',
      '2 lembar daun kunyit, robek-robek',
      '2 buah asam kandis',
      'Bumbu Halus: 150 gr bawang merah, 50 gr bawang putih, 200 gr cabai merah keriting, 3 cm jahe, 3 cm lengkuas, 2 cm kunyit bakar, 1 sdm ketumbar, 1/2 sdt pala bubuk, garam secukupnya'
    ],
    steps: [
      'Rebus santan encer bersama bumbu halus, daun kunyit, serai, daun jeruk, dan asam kandis hingga mendidih.',
      'Masukkan daging sapi, aduk perlahan agar daging tidak hancur dan santan tidak pecah.',
      'Masak dengan api sedang hingga air santan menyusut setengahnya dan mengeluarkan minyak alami.',
      'Tuangkan santan kental, kecilkan api kompor ke tingkat minimal.',
      'Aduk terus secara berkala agar bagian bawah tidak gosong. Masak selama 3-4 jam hingga kuah mengering dan berwarna cokelat gelap.'
    ],
    is_popular: true,
    difficulty: 'sulit'
  },
  {
    title: 'Udang Asam Manis',
    slug: 'udang-asam-manis',
    description: 'Udang segar berbalut saus asam manis yang kental dan segar, disajikan dengan potongan wortel dan nanas.',
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
    region: 'Betawi',
    prep_time: 15,
    cook_time: 15,
    servings: 3,
    ingredients: [
      '350 gram udang ukuran sedang, kupas kulit sisakan ekor',
      '1 sdm air jeruk nipis',
      '1 buah bawang bombay, iris tipis',
      '2 siung bawang putih, cincang halus',
      '4 sdm saus tomat',
      '2 sdm saus sambal',
      '1 sdm kecap inggris',
      '1/2 buah nanas kupas, potong kipas kecil',
      '1/2 sdt maizena larutkan dengan sedikit air',
      'Garam dan merica secukupnya'
    ],
    steps: [
      'Lumuri udang dengan air jeruk nipis dan garam, diamkan selama 5 menit.',
      'Tumis bawang putih dan bawang bombay hingga layu dan mengeluarkan aroma harum.',
      'Masukkan udang, aduk cepat hingga udang berubah warna menjadi kemerahan.',
      'Tambahkan saus tomat, saus sambal, kecap inggris, garam, dan merica bubuk. Aduk rata.',
      'Masukkan potongan nanas dan tuangkan larutan maizena untuk mengentalkan saus.',
      'Masak sebentar hingga saus meletup-letup, angkat, lalu segera sajikan.'
    ],
    is_popular: true,
    difficulty: 'mudah'
  },
  {
    title: 'Nasi Goreng Spesial',
    slug: 'nasi-goreng-spesial',
    description: 'Nasi goreng aromatik khas Indonesia dilengkapi dengan telur mata sapi, ayam suwir, bakso, dan kerupuk udang.',
    image_url: 'https://images.unsplash.com/photo-1617692518154-15697f288849?w=800&auto=format&fit=crop&q=80',
    region: 'Jawa',
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    ingredients: [
      '2 piring nasi dingin sisa semalam',
      '2 butir telur (1 untuk dicampur, 1 untuk telur mata sapi)',
      '5 butir bakso sapi, iris tipis',
      '50 gram ayam suwir',
      '2 sdm kecap manis',
      '1 sdm saus tiram',
      '1 batang daun bawang, iris halus',
      'Bumbu Halus: 4 butir bawang merah, 2 siung bawang putih, 2 buah cabai merah keriting, 1 butir kemiri, 1/2 sdt terasi bakar, garam secukupnya'
    ],
    steps: [
      'Tumis bumbu halus hingga harum dan benar-benar matang.',
      'Sisihkan bumbu ke pinggir wajan, masukkan 1 butir telur di tengah wajan lalu buat orak-arik.',
      'Masukkan bakso sapi dan ayam suwir, aduk rata dengan bumbu dan telur.',
      'Masukkan nasi dingin, lalu tambahkan kecap manis, saus tiram, dan daun bawang.',
      'Aduk cepat dengan api besar hingga nasi tercampur rata dan matang berasap (smoky).',
      'Sajikan nasi goreng hangat dengan telur mata sapi, irisan mentimun, tomat, dan kerupuk.'
    ],
    is_popular: true,
    difficulty: 'mudah'
  },
  {
    title: 'Sambal Terasi',
    slug: 'sambal-terasi',
    description: 'Sambal khas Nusantara dengan rasa pedas pedas manis berkat terasi bakar pilihan dan cabai segar.',
    image_url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=80',
    region: 'Sunda',
    prep_time: 10,
    cook_time: 10,
    servings: 5,
    ingredients: [
      '10 buah cabai merah keriting',
      '8 buah cabai rawit merah (sesuai selera)',
      '5 butir bawang merah',
      '2 siung bawang putih',
      '1 sdt terasi bakar beraroma kuat',
      '1 buah tomat merah kecil',
      '1 sdt gula merah sisir',
      '1 sdt air jeruk limau',
      'Minyak goreng dan garam secukupnya'
    ],
    steps: [
      'Panaskan sedikit minyak, goreng cabai merah, cabai rawit, bawang merah, bawang putih, dan tomat hingga layu.',
      'Angkat lalu ulek kasar bahan sambal yang sudah digoreng bersama terasi bakar.',
      'Tambahkan gula merah dan garam, ulek kembali hingga merata.',
      'Koreksi rasa, lalu beri kucuran air jeruk limau untuk sensasi segar.',
      'Sambal siap disajikan sebagai pelengkap lalapan dan lauk pauk goreng.'
    ],
    is_popular: true,
    difficulty: 'mudah'
  },
  {
    title: 'Gado-Gado Betawi',
    slug: 'gado-gado-betawi',
    description: 'Salad khas Indonesia berisi sayuran rebus segar, tahu, tempe, kentang, disiram bumbu kacang gurih pedas.',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    region: 'Betawi',
    prep_time: 20,
    cook_time: 20,
    servings: 3,
    ingredients: [
      '150 gram sayuran: kangkung, taoge, kol (rebus terpisah)',
      '1 buah kentang rebus, potong dadu',
      '1 buah tahu goreng & 1 papan tempe goreng, potong-potong',
      '1 buah mentimun, iris tipis segar',
      'Bahan Bumbu Kacang: 150 gr kacang tanah goreng (haluskan), 2 siung bawang putih, 3 buah cabai rawit, 1 sdm gula merah sisir, 1 sdt air asam jawa, garam secukupnya, air hangat secukupnya',
      'Pelengkap: kerupuk emping melinjo, telur rebus, bawang goreng'
    ],
    steps: [
      'Ulek bawang putih, cabai rawit, dan garam di cobek hingga halus.',
      'Tambahkan gula merah, lalu masukkan kacang tanah goreng yang sudah dihaluskan dan air asam jawa.',
      'Tuangkan air hangat sedikit demi sedikit sambil diulek/diaduk hingga bumbu kacang mengental dan licin.',
      'Tata sayuran rebus, kentang, tahu, tempe, dan mentimun di piring saji.',
      'Siram dengan bumbu kacang di atasnya hingga merata.',
      'Sajikan dengan telur rebus di atasnya, taburan bawang goreng, dan kerupuk emping.'
    ],
    is_popular: true,
    difficulty: 'sedang'
  },
  {
    title: 'Sate Ayam Madura',
    slug: 'sate-ayam-madura',
    description: 'Sate ayam bakar aromatik berbalut bumbu kacang halus khas Madura, disajikan dengan lontong dan acar.',
    image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop&q=80',
    region: 'Jawa',
    prep_time: 25,
    cook_time: 20,
    servings: 4,
    ingredients: [
      '500 gram dada ayam fillet, potong dadu kecil',
      'Tusuk sate secukupnya',
      'Bahan Saus Kacang: 200 gr kacang tanah goreng, 3 siung bawang putih, 4 butir bawang merah, 2 buah cabai merah keriting, 3 sdm kecap manis, garam, gula merah secukupnya, air hangat secukupnya',
      'Bahan Olesan Sate: 2 sdm bumbu kacang, 2 sdm kecap manis, 1 sdm minyak goreng',
      'Bahan Pelengkap: lontong, bawang goreng, irisan bawang merah segar, cabai rawit rebus'
    ],
    steps: [
      'Tusuk potongan daging ayam ke tusuk sate (sekitar 4-5 potongan per tusuk).',
      'Untuk saus kacang: Haluskan kacang tanah, bawang putih, bawang merah, cabai merah keriting dengan sedikit air hangat. Masak saus kacang dengan api kecil hingga mengeluarkan minyak alami, tambahkan kecap manis, garam, dan gula merah.',
      'Campurkan bahan olesan sate di wadah datar. Lumuri sate ayam dengan bahan olesan secara merata.',
      'Bakar sate di atas panggangan atau bara api sambil dibolak-balik hingga matang kecokelatan beraroma bakar.',
      'Sajikan sate ayam di piring datar, siram dengan saus kacang hangat, beri kecap manis, bawang goreng, lontong, dan potongan cabai rawit.'
    ],
    is_popular: true,
    difficulty: 'sedang'
  }
];
