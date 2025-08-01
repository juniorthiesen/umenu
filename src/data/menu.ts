import { Category } from '../types';

export const menuData: Category[] = [
  {
    id: 'fritos',
    name: 'Fritos',
    products: [
      {
        id: 1,
        name: 'Pastel',
        description: 'Massa fina e sequinha, frita até dourar, envolvendo um recheio generoso e bem temperado. Uma explosão de sabor a cada mordida.',
        price: 130.00,
        pricingType: 'cento',
        minQuantity: 25,
        step: 25,
        image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/pastel.png',
        promotion: {
          isActive: true,
          promotionalPrice: 110.00,
          discountPercentage: 15,
          validUntil: '2025-12-31T23:59:59',
          label: 'OFERTA'
        }
      },
      { id: 2, name: 'Kibe', description: 'O clássico da culinária árabe, nosso kibe é feito com uma mistura perfeita de carne e trigo, temperado com especiarias que garantem um sabor autêntico e inesquecível.', price: 130.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/kibe.png' },
      { id: 3, name: 'Risoles', description: 'Massa macia que desmancha na boca, recheada com um creme delicioso de frango desfiado e o toque aveludado do requeijão cremoso.', price: 130.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/risoles.png' },
      { id: 4, name: 'Croquete', description: 'Delicioso salgado de massa macia e recheio cremoso de carne, empanado e frito na perfeição.', price: 130.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/croquete.png' },
      { id: 5, name: 'Bolinha de Queijo', description: 'Um clássico irresistível com massa leve e um recheio generoso de queijo derretido, que estica a cada mordida.', price: 130.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/bolinha-queijo.png' },
      { id: 6, name: 'Enroladinho de Salsicha', description: 'A combinação perfeita de massa fofinha e uma salsicha de qualidade, resultando num salgado suculento e ideal para qualquer ocasião.', price: 130.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://placehold.co/300x300/F97316/FFFFFF?text=Enroladinho+Salsicha' },
      { id: 7, name: 'Coxinha', description: 'A rainha das festas, com massa macia e dourada recheada com frango desfiado, suculento e perfeitamente temperado. Impossível comer uma só.', price: 130.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/coxinha.png' },
      { id: 8, name: 'Palito de Queijo', description: 'Um palito de queijo mussarela de alta qualidade, empanado numa casquinha crocante e frito na hora. Uma experiência deliciosa com queijo derretido e puxa-puxa.', price: 200.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/palito-de-queijo.png' },
      { id: 9, name: 'Pastel Especial com Ovo', description: 'Uma versão turbinada do nosso pastel, com massa crocante recheada com carne moída suculenta e um ovo inteiro, trazendo ainda mais sabor e sustância.', price: 135.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://placehold.co/300x300/F97316/FFFFFF?text=Pastel+Ovo' }
    ]
  },
  {
    id: 'mini-quiches',
    name: 'Mini Quiches',
    products: [
      {
        id: 10,
        name: 'Pêra Amêndoas e Gorgonzola',
        description: 'Uma combinação sofisticada de peras frescas, amêndoas crocantes e o sabor marcante do queijo gorgonzola.',
        price: 15.00,
        pricingType: 'unidade',
        step: 1,
        image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png',
        promotion: {
          isActive: true,
          promotionalPrice: 12.00,
          discountPercentage: 20,
          validUntil: '2025-12-31T23:59:59',
          label: 'PROMOÇÃO'
        }
      },
      { id: 11, name: 'Caprese', description: 'Uma combinação clássica italiana, trazendo a leveza do tomate fresco, o aroma do manjericão e a cremosidade da mussarela em uma base de massa delicada.', price: 12, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png' },
      { id: 12, name: 'Bacon e Milho', description: 'A cremosidade do milho com a crocância e o sabor inconfundível do bacon em uma mini quiche deliciosa.', price: 12, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png' },
      { id: 13, name: 'Alho Poró e Bacon', description: 'A suavidade do alho poró refogado combinada com pedaços de bacon crocante em uma base de massa delicada.', price: 12, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png' },
      { id: 14, name: 'Legumes', description: 'Uma opção leve e saudável, recheada com uma seleção de legumes frescos e temperados.', price: 10.00, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/quiche-abobrinha.png' }
    ]
  },
  {
    id: 'salgados-especiais',
    name: 'Salgados Especiais',
    products: [
      { id: 15, name: 'Empada', description: 'Massa que derrete na boca com um recheio cremoso e saboroso, disponível em diversos sabores.', price: 1.60, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/F59E0B/FFFFFF?text=Empada' },
      { id: 16, name: 'Esfirra de Calabresa', description: 'Massa macia e aerada com um recheio suculento de linguiça calabresa e cebola.', price: 1.60, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/esfirra.png' },
      { id: 17, name: 'Esfirra de Carne com Tomate e Azeitona', description: 'A tradicional esfirra de carne com o toque fresco do tomate e o sabor marcante da azeitona.', price: 1.60, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/esfirra.png' },
      { id: 18, name: 'Pastel de Frango com Requeijão', description: 'Uma massa delicada que se desfaz na boca, recheada com a combinação perfeita de frango desfiado e a cremosidade inconfundível do requeijão.', price: 1.60, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/F59E0B/FFFFFF?text=Pastel+Frango' },
      { id: 19, name: 'Pastel de Ricota com Salaminho Italiano', description: 'Uma combinação de sabores surpreendente, unindo a suavidade da ricota fresca com o toque picante e aromático do salaminho italiano.', price: 2.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/F59E0B/FFFFFF?text=Pastel+Ricota' }
    ]
  },
  {
    id: 'mini-lanches',
    name: 'Mini Lanches',
    products: [
      { id: 20, name: 'Mini Hambúrguer', description: 'Pão macio, carne suculenta e queijo derretido, a versão em miniatura do lanche mais amado do mundo.', price: 10.00, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/hamburguinho-1.png' },
      { id: 21, name: 'Mini Pizza', description: 'Uma versão em miniatura da pizza que todos amam. Massa fofinha, molho de tomate artesanal e coberturas deliciosas como Frango com Requeijão ou Calabresa.', price: 5.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/10B981/FFFFFF?text=Mini+Pizza' },
      { id: 22, name: 'Mini Dog Gourmet', description: 'O clássico cachorro-quente em versão gourmet. Salsicha de qualidade em um pão macio, acompanhado de milho, ervilha e finalizado com a crocância da batata palha.', price: 5.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/10B981/FFFFFF?text=Mini+Dog' },
    ]
  },
  {
    id: 'tortas-assadas',
    name: 'Tortas Assadas',
    products: [
      { id: 24, name: 'Portuguesa', description: 'Massa fofinha recheada com presunto, queijo mussarela, ovos, ervilhas frescas e azeitonas, criando um mosaico de sabores clássicos.', price: 110.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Portuguesa' },
      { id: 25, name: 'Hot Dog', description: 'Todo o sabor do seu cachorro-quente favorito em uma torta de forno, com massa macia, recheio de salsicha, molho cremoso e um toque de queijo.', price: 120.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Hotdog' },
      { id: 26, name: 'Frango com Requeijão', description: 'A combinação mais amada do Brasil em uma torta de massa rica, recheada com frango temperado e generosamente misturado com requeijão cremoso.', price: 100.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Frango' },
      { id: 27, name: 'Legumes', description: 'Uma opção saudável e saborosa. Massa leve recheada com um mix de legumes frescos e selecionados, refogados e bem temperados.', price: 90.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Legumes' },
      { id: 28, name: 'Atum', description: 'Uma torta com sabor de mar. Atum sólido refogado com tomates maduros, cebola e azeitonas, envolto em uma massa dourada e macia.', price: 120.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Atum' }
    ]
  },
  {
    id: 'doces',
    name: 'Doces',
    products: [
      {
        id: 29,
        name: 'Brigadeiro Tradicional',
        description: 'O clássico doce brasileiro, cremoso, com intenso sabor de chocolate e coberto com granulado crocante.',
        price: 190.00,
        pricingType: 'cento',
        minQuantity: 25,
        step: 25,
        image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/brigadeiro.png',
        promotion: {
          isActive: true,
          promotionalPrice: 160.00,
          discountPercentage: 16,
          validUntil: '2025-12-31T23:59:59',
          label: 'DESCONTO'
        }
      },
      { id: 30, name: 'Brigadeiro de Café', description: 'A combinação perfeita da doçura do brigadeiro com o toque aromático e intenso do café, ideal para despertar o paladar.', price: 190.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png' },
      { id: 31, name: 'Brigadeiro de Limão', description: 'A doçura do brigadeiro branco encontra o frescor e a acidez cítrica do limão siciliano. Uma sobremesa refrescante e sofisticada.', price: 190.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png' },
      { id: 32, name: 'Brigadeiro de Paçoca', description: 'A união irresistível do brigadeiro cremoso com o sabor marcante e a textura inconfundível da paçoca de amendoim.', price: 190.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png' },
      { id: 33, name: 'Brigadeiro de Amendoim', description: 'Um brigadeiro cremoso enriquecido com pedaços crocantes de amendoim torrado. Uma experiência de textura e sabor inigualável.', price: 190.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png' },
      { id: 34, name: 'Brigadeiro Ninho', description: 'A suavidade e o sabor inconfundível do leite em pó em um brigadeiro cremoso e delicado que derrete na boca.', price: 190.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/ninho.png' },
      { id: 35, name: 'Brigadeiro Ninho Com Nutella', description: 'A combinação perfeita do brigadeiro de Leite Ninho com um coração cremoso de Nutella, o famoso creme de avelã.', price: 220.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/ninho.png' },
      { id: 36, name: 'Beijinho', description: 'O clássico beijinho de coco, cremoso e doce na medida certa. Escolha entre a versão tradicional ou a intensidade do coco queimado.', price: 190.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/beijinho.png' },
      { id: 37, name: 'Cajuzinho', description: 'Tradicional doce de festa à base de amendoim, com formato característico e um sabor nostálgico que remete à infância.', price: 190.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png' },
      { id: 38, name: 'Dois Amores', description: 'Uma celebração ao contraste perfeito: metade brigadeiro de chocolate intenso, metade brigadeiro branco cremoso, unidos em um só doce.', price: 190.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png' },
      { id: 39, name: 'Churros Ninho e Nutella', description: 'Inspirado no doce espanhol, nosso docinho tem massa com sabor de churros, recheio cremoso de Nutella e uma cobertura generosa de Leite Ninho.', price: 220.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png' },
      { id: 40, name: 'Surpresa de Uva', description: 'Uma uva fresca e suculenta, coberta por um brigadeiro branco cremoso e finalizada com uma fina camada de açúcar.', price: 220.00, pricingType: 'cento', minQuantity: 25, step: 25, image: 'https://placehold.co/300x300/A16207/FFFFFF?text=Surpresa+Uva' }
    ]
  },
  {
    id: 'bolos-recheados',
    name: 'Bolos Recheados',
    products: [
      { id: 41, name: 'Quatro Leites com Morango', description: 'Massa branca fofinha com um recheio cremoso à base de quatro leites e pedaços de morango fresco, criando um equilíbrio perfeito de doçura e acidez.', price: 80.00, pricingType: 'kg', minQuantity: 1.5, step: 0.5, image: 'https://placehold.co/300x300/EC4899/FFFFFF?text=Bolo+4+Leites' },
      { id: 42, name: 'Leite Condensado Cozido', description: 'Bolo de massa branca fofinha, recheado com o mais puro doce de leite cremoso. Escolha o complemento perfeito: ameixa ou coco em fruta.', price: 80.00, pricingType: 'kg', minQuantity: 1.5, step: 0.5, image: 'https://placehold.co/300x300/EC4899/FFFFFF?text=Bolo+Doce+Leite' },
      { id: 43, name: 'Brigadeiro Gourmet com Morango', description: 'Intenso bolo de chocolate com recheio e cobertura de brigadeiro gourmet e morangos frescos, uma combinação clássica e irresistível.', price: 80.00, pricingType: 'kg', minQuantity: 1.5, step: 0.5, image: 'https://placehold.co/300x300/EC4899/FFFFFF?text=Bolo+Brigadeiro' },
      { id: 44, name: 'Nata Morango e Suspiro', description: 'Uma combinação leve e sofisticada de pão de ló, nata fresca, morangos e pedaços de suspiro crocante.', price: 90.00, pricingType: 'kg', minQuantity: 1.5, step: 0.5, image: 'https://placehold.co/300x300/EC4899/FFFFFF?text=Bolo+Nata' }
    ]
  },
  {
    id: 'caseirinhos',
    name: 'Caseirinhos',
    products: [
      { id: 45, name: 'Fubá com Cream Cheese e Goiabada', description: 'Bolo de fubá fofinho com recheio cremoso de cream cheese e pedaços de goiabada, a combinação perfeita do campo com um toque sofisticado.', price: 100.00, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/fuba-cream-chease-goiabada.png' },
      { id: 46, name: 'Cabotiá com Cocada Cremosa', description: 'Bolo de abóbora cabotiá com uma deliciosa cobertura de cocada cremosa, unindo dois sabores brasileiros em uma sobremesa única.', price: 100.00, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/bolo-cabotia-cocada.png' },
      { id: 47, name: 'Chocolate com Brigadeiro Gourmet', description: 'Bolo de chocolate intenso com cobertura generosa de brigadeiro gourmet, feito com chocolate nobre para os verdadeiros chocólatras.', price: 90.00, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/caseirinho-gourmet.png' },
      { id: 48, name: 'Cenoura com Brigadeiro Gourmet', description: 'O clássico bolo de cenoura fofinho, coberto com uma camada irresistível de brigadeiro gourmet cremoso.', price: 90.00, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/cenoura-com-chocolate.png' },
      { id: 49, name: 'Charge', description: 'Bolo inspirado no famoso chocolate, com uma rica combinação de amendoim, caramelo salgado e uma generosa cobertura de chocolate.', price: 110.00, pricingType: 'unidade', step: 1, image: 'https://adsmentor.com.br/wp-content/uploads/2025/07/charge.png' },
      { id: 50, name: 'Fubá com Erva Doce', description: 'Bolo de fubá tradicional com o toque aromático da erva doce, perfeito para um café da tarde cheio de sabor e memória afetiva.', price: 50.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/A16207/FFFFFF?text=Fubá+Erva+Doce' },
      { id: 51, name: 'Toalha Felpuda', description: 'Um bolo gelado de massa branca, molhadinho com calda de coco e coberto com coco ralado fresco, criando uma textura única e um sabor marcante.', price: 120.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/A16207/FFFFFF?text=Toalha+Felpuda' },
      { id: 52, name: 'Nega Maluca', description: 'Bolo de chocolate fofinho e úmido com uma calda de chocolate cremosa, um clássico brasileiro que agrada a todas as gerações.', price: 120.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/A16207/FFFFFF?text=Nega+Maluca' },
      { id: 53, name: 'Laranja', description: 'Bolo caseiro de laranja, com uma massa fofinha e um leve toque cítrico, coberto com uma fina calda de açúcar para um acabamento perfeito.', price: 65.00, pricingType: 'unidade', step: 1, image: 'https://placehold.co/300x300/A16207/FFFFFF?text=Bolo+Laranja' }
    ]
  },
  {
    id: 'lasanhas-empadao',
    name: 'Lasanhas & Empadão',
    products: [
      { id: 54, name: 'Lasanha de Frango', description: 'Camadas de massa fresca, recheio cremoso de frango desfiado e temperado, cobertas com molho branco aveludado e queijo gratinado.', price: 50.00, pricingType: 'kg', minQuantity: 1, step: 0.5, image: 'https://placehold.co/300x300/EF4444/FFFFFF?text=Lasanha+Frango' },
      { id: 55, name: 'Lasanha de Bolonhesa', description: 'A clássica lasanha italiana com camadas de massa, molho à bolonhesa rico e suculento, molho branco e queijo mussarela derretido.', price: 50.00, pricingType: 'kg', minQuantity: 1, step: 0.5, image: 'https://placehold.co/300x300/EF4444/FFFFFF?text=Lasanha+Bolonhesa' },
      { id: 56, name: 'Lasanha 4 queijos', description: 'Uma combinação irresistível de queijos (mussarela, provolone, parmesão e gorgonzola) entre camadas de massa fresca e molho branco cremoso.', price: 75.00, pricingType: 'kg', minQuantity: 1, step: 0.5, image: 'https://placehold.co/300x300/EF4444/FFFFFF?text=Lasanha+4+Queijos' },
      { id: 57, name: 'Empadão', description: 'Massa podre que derrete na boca com um recheio generoso e cremoso. Escolha entre o clássico frango com requeijão ou o delicado palmito.', price: 50.00, pricingType: 'kg', minQuantity: 1, step: 0.5, image: 'https://placehold.co/300x300/EF4444/FFFFFF?text=Empadão' }
    ]
  }
];