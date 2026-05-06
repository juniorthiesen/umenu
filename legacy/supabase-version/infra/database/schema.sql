-- ==========================================================
-- SCRIPT PARA POPULAR O MENU COMPLETO - SALGADOS & CIA
-- Limpa os dados existentes e insere o cardápio completo.
-- ==========================================================

DO $$
DECLARE
    -- Variáveis para armazenar os UUIDs das categorias
    fritos_id UUID;
    mini_quiches_id UUID;
    salgados_especiais_id UUID;
    mini_lanches_id UUID;
    tortas_assadas_id UUID;
    doces_id UUID;
    bolos_recheados_id UUID;
    caseirinhos_id UUID;
    lasanhas_empadao_id UUID;

    -- Variável para armazenar o UUID do produto para promoções
    prod_id UUID;
BEGIN
    -- ----------------------------------------------------------
    -- 1. LIMPAR DADOS EXISTENTES (PROMOÇÕES, PRODUTOS E CATEGORIAS)
    -- Isso garante que não haverá duplicatas.
    -- ----------------------------------------------------------
    RAISE NOTICE 'Limpando tabelas existentes...';
    DELETE FROM umenu_promotions;
    DELETE FROM umenu_products;
    DELETE FROM umenu_categories;
    RAISE NOTICE 'Tabelas limpas com sucesso.';

    -- ----------------------------------------------------------
    -- 2. INSERIR CATEGORIAS
    -- As categorias são inseridas primeiro para que os produtos
    -- possam referenciá-las.
    -- ----------------------------------------------------------
    RAISE NOTICE 'Inserindo categorias...';
    INSERT INTO umenu_categories (name, slug, description, display_order) VALUES
        ('Fritos', 'fritos', 'Salgados fritos crocantes e saborosos', 1),
        ('Mini Quiches', 'mini-quiches', 'Mini quiches gourmet com sabores especiais', 2),
        ('Salgados Especiais', 'salgados-especiais', 'Salgados especiais da casa, assados ou montados na hora.', 3),
        ('Mini Lanches', 'mini-lanches', 'Mini lanches perfeitos para festas e eventos.', 4),
        ('Tortas Assadas', 'tortas-assadas', 'Tortas de forno com massa fofinha e recheios variados.', 5),
        ('Doces', 'doces', 'Doces tradicionais e gourmet para adoçar sua festa.', 6),
        ('Bolos Recheados', 'bolos-recheados', 'Bolos recheados por kg, feitos sob encomenda.', 7),
        ('Caseirinhos', 'caseirinhos', 'Bolos caseiros com gostinho de casa de vó.', 8),
        ('Lasanhas & Empadão', 'lasanhas-empadao', 'Deliciosas lasanhas e empadões feitos na casa.', 9);

    -- Obter os UUIDs das categorias inseridas
    SELECT id INTO fritos_id FROM umenu_categories WHERE slug = 'fritos';
    SELECT id INTO mini_quiches_id FROM umenu_categories WHERE slug = 'mini-quiches';
    SELECT id INTO salgados_especiais_id FROM umenu_categories WHERE slug = 'salgados-especiais';
    SELECT id INTO mini_lanches_id FROM umenu_categories WHERE slug = 'mini-lanches';
    SELECT id INTO tortas_assadas_id FROM umenu_categories WHERE slug = 'tortas-assadas';
    SELECT id INTO doces_id FROM umenu_categories WHERE slug = 'doces';
    SELECT id INTO bolos_recheados_id FROM umenu_categories WHERE slug = 'bolos-recheados';
    SELECT id INTO caseirinhos_id FROM umenu_categories WHERE slug = 'caseirinhos';
    SELECT id INTO lasanhas_empadao_id FROM umenu_categories WHERE slug = 'lasanhas-empadao';
    RAISE NOTICE 'Categorias inseridas com sucesso.';

    -- ----------------------------------------------------------
    -- 3. INSERIR PRODUTOS E PROMOÇÕES
    -- ----------------------------------------------------------
    RAISE NOTICE 'Inserindo produtos e promoções...';

    -- == Categoria: Fritos ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (fritos_id, 'Pastel', 'pastel', 'Massa fina e sequinha, frita até dourar, envolvendo um recheio generoso e bem temperado. Uma explosão de sabor a cada mordida.', 130.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/pastel.png', 1) RETURNING id INTO prod_id;
    INSERT INTO umenu_promotions (product_id, name, label, promotional_price, discount_percentage, valid_until) VALUES (prod_id, 'Oferta de Pastel', 'OFERTA', 110.00, 15, '2025-12-31T23:59:59');

    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (fritos_id, 'Kibe', 'kibe', 'O clássico da culinária árabe, nosso kibe é feito com uma mistura perfeita de carne e trigo, temperado com especiarias que garantem um sabor autêntico e inesquecível.', 130.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/kibe.png', 2),
    (fritos_id, 'Risoles', 'risoles', 'Massa macia que desmancha na boca, recheada com um creme delicioso de frango desfiado e o toque aveludado do requeijão cremoso.', 130.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/risoles.png', 3),
    (fritos_id, 'Croquete', 'croquete', 'Delicioso salgado de massa macia e recheio cremoso de carne, empanado e frito na perfeição.', 130.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/croquete.png', 4),
    (fritos_id, 'Bolinha de Queijo', 'bolinha-de-queijo', 'Um clássico irresistível com massa leve e um recheio generoso de queijo derretido, que estica a cada mordida.', 130.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/bolinha-queijo.png', 5),
    (fritos_id, 'Enroladinho de Salsicha', 'enroladinho-salsicha', 'A combinação perfeita de massa fofinha e uma salsicha de qualidade, resultando num salgado suculento e ideal para qualquer ocasião.', 130.00, 'cento', 25, 25, 'https://placehold.co/300x300/F97316/FFFFFF?text=Enroladinho+Salsicha', 6),
    (fritos_id, 'Coxinha', 'coxinha', 'A rainha das festas, com massa macia e dourada recheada com frango desfiado, suculento e perfeitamente temperado. Impossível comer uma só.', 130.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/coxinha.png', 7),
    (fritos_id, 'Palito de Queijo', 'palito-de-queijo', 'Um palito de queijo mussarela de alta qualidade, empanado numa casquinha crocante e frito na hora. Uma experiência deliciosa com queijo derretido e puxa-puxa.', 200.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/palito-de-queijo.png', 8),
    (fritos_id, 'Pastel Especial com Ovo', 'pastel-especial-com-ovo', 'Uma versão turbinada do nosso pastel, com massa crocante recheada com carne moída suculenta e um ovo inteiro, trazendo ainda mais sabor e sustância.', 135.00, 'cento', 25, 25, 'https://placehold.co/300x300/F97316/FFFFFF?text=Pastel+Ovo', 9);

    -- == Categoria: Mini Quiches ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (mini_quiches_id, 'Pêra, Amêndoas e Gorgonzola', 'quiche-pera-amendoas-gorgonzola', 'Uma combinação sofisticada de peras frescas, amêndoas crocantes e o sabor marcante do queijo gorgonzola.', 15.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png', 1) RETURNING id INTO prod_id;
    INSERT INTO umenu_promotions (product_id, name, label, promotional_price, discount_percentage, valid_until) VALUES (prod_id, 'Promoção de Quiche', 'PROMOÇÃO', 12.00, 20, '2025-12-31T23:59:59');

    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (mini_quiches_id, 'Caprese', 'quiche-caprese', 'Uma combinação clássica italiana, trazendo a leveza do tomate fresco, o aroma do manjericão e a cremosidade da mussarela em uma base de massa delicada.', 12.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png', 2),
    (mini_quiches_id, 'Bacon e Milho', 'quiche-bacon-milho', 'A cremosidade do milho com a crocância e o sabor inconfundível do bacon em uma mini quiche deliciosa.', 12.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png', 3),
    (mini_quiches_id, 'Alho Poró e Bacon', 'quiche-alho-poro-bacon', 'A suavidade do alho poró refogado combinada com pedaços de bacon crocante em uma base de massa delicada.', 12.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/Quiches.png', 4),
    (mini_quiches_id, 'Legumes', 'quiche-legumes', 'Uma opção leve e saudável, recheada com uma seleção de legumes frescos e temperados.', 10.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/quiche-abobrinha.png', 5);

    -- == Categoria: Salgados Especiais ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (salgados_especiais_id, 'Empada', 'empada', 'Massa que derrete na boca com um recheio cremoso e saboroso, disponível em diversos sabores.', 1.60, 'unidade', 1, 1, 'https://placehold.co/300x300/F59E0B/FFFFFF?text=Empada', 1),
    (salgados_especiais_id, 'Esfirra de Calabresa', 'esfirra-calabresa', 'Massa macia e aerada com um recheio suculento de linguiça calabresa e cebola.', 1.60, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/esfirra.png', 2),
    (salgados_especiais_id, 'Esfirra de Carne com Tomate e Azeitona', 'esfirra-carne-tomate-azeitona', 'A tradicional esfirra de carne com o toque fresco do tomate e o sabor marcante da azeitona.', 1.60, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/esfirra.png', 3),
    (salgados_especiais_id, 'Pastel de Frango com Requeijão', 'pastel-assado-frango-requeijao', 'Uma massa delicada que se desfaz na boca, recheada com a combinação perfeita de frango desfiado e a cremosidade inconfundível do requeijão.', 1.60, 'unidade', 1, 1, 'https://placehold.co/300x300/F59E0B/FFFFFF?text=Pastel+Frango', 4),
    (salgados_especiais_id, 'Pastel de Ricota com Salaminho Italiano', 'pastel-assado-ricota-salaminho', 'Uma combinação de sabores surpreendente, unindo a suavidade da ricota fresca com o toque picante e aromático do salaminho italiano.', 2.00, 'unidade', 1, 1, 'https://placehold.co/300x300/F59E0B/FFFFFF?text=Pastel+Ricota', 5);

    -- == Categoria: Mini Lanches ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (mini_lanches_id, 'Mini Hambúrguer', 'mini-hamburguer', 'Pão macio, carne suculenta e queijo derretido, a versão em miniatura do lanche mais amado do mundo.', 10.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/hamburguinho-1.png', 1),
    (mini_lanches_id, 'Mini Pizza', 'mini-pizza', 'Uma versão em miniatura da pizza que todos amam. Massa fofinha, molho de tomate artesanal e coberturas deliciosas como Frango com Requeijão ou Calabresa.', 5.00, 'unidade', 1, 1, 'https://placehold.co/300x300/10B981/FFFFFF?text=Mini+Pizza', 2),
    (mini_lanches_id, 'Mini Dog Gourmet', 'mini-dog-gourmet', 'O clássico cachorro-quente em versão gourmet. Salsicha de qualidade em um pão macio, acompanhado de milho, ervilha e finalizado com a crocância da batata palha.', 5.00, 'unidade', 1, 1, 'https://placehold.co/300x300/10B981/FFFFFF?text=Mini+Dog', 3);

    -- == Categoria: Tortas Assadas ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (tortas_assadas_id, 'Torta Portuguesa', 'torta-portuguesa', 'Massa fofinha recheada com presunto, queijo mussarela, ovos, ervilhas frescas e azeitonas, criando um mosaico de sabores clássicos.', 110.00, 'unidade', 1, 1, 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Portuguesa', 1),
    (tortas_assadas_id, 'Torta Hot Dog', 'torta-hot-dog', 'Todo o sabor do seu cachorro-quente favorito em uma torta de forno, com massa macia, recheio de salsicha, molho cremoso e um toque de queijo.', 120.00, 'unidade', 1, 1, 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Hotdog', 2),
    (tortas_assadas_id, 'Torta de Frango com Requeijão', 'torta-frango-requeijao', 'A combinação mais amada do Brasil em uma torta de massa rica, recheada com frango temperado e generosamente misturado com requeijão cremoso.', 100.00, 'unidade', 1, 1, 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Frango', 3),
    (tortas_assadas_id, 'Torta de Legumes', 'torta-legumes', 'Uma opção saudável e saborosa. Massa leve recheada com um mix de legumes frescos e selecionados, refogados e bem temperados.', 90.00, 'unidade', 1, 1, 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Legumes', 4),
    (tortas_assadas_id, 'Torta de Atum', 'torta-atum', 'Uma torta com sabor de mar. Atum sólido refogado com tomates maduros, cebola e azeitonas, envolto em uma massa dourada e macia.', 120.00, 'unidade', 1, 1, 'https://placehold.co/300x300/6366F1/FFFFFF?text=Torta+Atum', 5);
    
    -- == Categoria: Doces ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (doces_id, 'Brigadeiro Tradicional', 'brigadeiro-tradicional', 'O clássico doce brasileiro, cremoso, com intenso sabor de chocolate e coberto com granulado crocante.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/brigadeiro.png', 1) RETURNING id INTO prod_id;
    INSERT INTO umenu_promotions (product_id, name, label, promotional_price, discount_percentage, valid_until) VALUES (prod_id, 'Desconto no Brigadeiro', 'DESCONTO', 160.00, 16, '2025-12-31T23:59:59');

    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (doces_id, 'Brigadeiro de Café', 'brigadeiro-cafe', 'A combinação perfeita da doçura do brigadeiro com o toque aromático e intenso do café, ideal para despertar o paladar.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png', 2),
    (doces_id, 'Brigadeiro de Limão', 'brigadeiro-limao', 'A doçura do brigadeiro branco encontra o frescor e a acidez cítrica do limão siciliano. Uma sobremesa refrescante e sofisticada.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png', 3),
    (doces_id, 'Brigadeiro de Paçoca', 'brigadeiro-pacoca', 'A união irresistível do brigadeiro cremoso com o sabor marcante e a textura inconfundível da paçoca de amendoim.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png', 4),
    (doces_id, 'Brigadeiro de Amendoim', 'brigadeiro-amendoim', 'Um brigadeiro cremoso enriquecido com pedaços crocantes de amendoim torrado. Uma experiência de textura e sabor inigualável.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png', 5),
    (doces_id, 'Brigadeiro Ninho', 'brigadeiro-ninho', 'A suavidade e o sabor inconfundível do leite em pó em um brigadeiro cremoso e delicado que derrete na boca.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/ninho.png', 6),
    (doces_id, 'Brigadeiro Ninho Com Nutella', 'brigadeiro-ninho-nutella', 'A combinação perfeita do brigadeiro de Leite Ninho com um coração cremoso de Nutella, o famoso creme de avelã.', 220.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/ninho.png', 7),
    (doces_id, 'Beijinho', 'beijinho', 'O clássico beijinho de coco, cremoso e doce na medida certa. Escolha entre a versão tradicional ou a intensidade do coco queimado.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/beijinho.png', 8),
    (doces_id, 'Cajuzinho', 'cajuzinho', 'Tradicional doce de festa à base de amendoim, com formato característico e um sabor nostálgico que remete à infância.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png', 9),
    (doces_id, 'Dois Amores', 'doce-dois-amores', 'Uma celebração ao contraste perfeito: metade brigadeiro de chocolate intenso, metade brigadeiro branco cremoso, unidos em um só doce.', 190.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png', 10),
    (doces_id, 'Churros Ninho e Nutella', 'doce-churros-ninho-nutella', 'Inspirado no doce espanhol, nosso docinho tem massa com sabor de churros, recheio cremoso de Nutella e uma cobertura generosa de Leite Ninho.', 220.00, 'cento', 25, 25, 'https://adsmentor.com.br/wp-content/uploads/2025/07/docinhos.png', 11),
    (doces_id, 'Surpresa de Uva', 'surpresa-de-uva', 'Uma uva fresca e suculenta, coberta por um brigadeiro branco cremoso e finalizada com uma fina camada de açúcar.', 220.00, 'cento', 25, 25, 'https://placehold.co/300x300/A16207/FFFFFF?text=Surpresa+Uva', 12);

    -- == Categoria: Bolos Recheados ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (bolos_recheados_id, 'Quatro Leites com Morango', 'bolo-quatro-leites-morango', 'Massa branca fofinha com um recheio cremoso à base de quatro leites e pedaços de morango fresco, criando um equilíbrio perfeito de doçura e acidez.', 80.00, 'kg', 1.5, 0.5, 'https://placehold.co/300x300/EC4899/FFFFFF?text=Bolo+4+Leites', 1),
    (bolos_recheados_id, 'Leite Condensado Cozido', 'bolo-doce-de-leite', 'Bolo de massa branca fofinha, recheado com o mais puro doce de leite cremoso. Escolha o complemento perfeito: ameixa ou coco em fruta.', 80.00, 'kg', 1.5, 0.5, 'https://placehold.co/300x300/EC4899/FFFFFF?text=Bolo+Doce+Leite', 2),
    (bolos_recheados_id, 'Brigadeiro Gourmet com Morango', 'bolo-brigadeiro-morango', 'Intenso bolo de chocolate com recheio e cobertura de brigadeiro gourmet e morangos frescos, uma combinação clássica e irresistível.', 80.00, 'kg', 1.5, 0.5, 'https://placehold.co/300x300/EC4899/FFFFFF?text=Bolo+Brigadeiro', 3),
    (bolos_recheados_id, 'Nata, Morango e Suspiro', 'bolo-nata-morango-suspiro', 'Uma combinação leve e sofisticada de pão de ló, nata fresca, morangos e pedaços de suspiro crocante.', 90.00, 'kg', 1.5, 0.5, 'https://placehold.co/300x300/EC4899/FFFFFF?text=Bolo+Nata', 4);

    -- == Categoria: Caseirinhos ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (caseirinhos_id, 'Fubá com Cream Cheese e Goiabada', 'caseirinho-fuba-cream-cheese-goiabada', 'Bolo de fubá fofinho com recheio cremoso de cream cheese e pedaços de goiabada, a combinação perfeita do campo com um toque sofisticado.', 100.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/fuba-cream-chease-goiabada.png', 1),
    (caseirinhos_id, 'Cabotiá com Cocada Cremosa', 'caseirinho-cabotia-cocada', 'Bolo de abóbora cabotiá com uma deliciosa cobertura de cocada cremosa, unindo dois sabores brasileiros em uma sobremesa única.', 100.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/bolo-cabotia-cocada.png', 2),
    (caseirinhos_id, 'Chocolate com Brigadeiro Gourmet', 'caseirinho-chocolate-brigadeiro', 'Bolo de chocolate intenso com cobertura generosa de brigadeiro gourmet, feito com chocolate nobre para os verdadeiros chocólatras.', 90.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/caseirinho-gourmet.png', 3),
    (caseirinhos_id, 'Cenoura com Brigadeiro Gourmet', 'caseirinho-cenoura-brigadeiro', 'O clássico bolo de cenoura fofinho, coberto com uma camada irresistível de brigadeiro gourmet cremoso.', 90.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/cenoura-com-chocolate.png', 4),
    (caseirinhos_id, 'Charge', 'caseirinho-charge', 'Bolo inspirado no famoso chocolate, com uma rica combinação de amendoim, caramelo salgado e uma generosa cobertura de chocolate.', 110.00, 'unidade', 1, 1, 'https://adsmentor.com.br/wp-content/uploads/2025/07/charge.png', 5),
    (caseirinhos_id, 'Fubá com Erva Doce', 'caseirinho-fuba-erva-doce', 'Bolo de fubá tradicional com o toque aromático da erva doce, perfeito para um café da tarde cheio de sabor e memória afetiva.', 50.00, 'unidade', 1, 1, 'https://placehold.co/300x300/A16207/FFFFFF?text=Fubá+Erva+Doce', 6),
    (caseirinhos_id, 'Toalha Felpuda', 'caseirinho-toalha-felpuda', 'Um bolo gelado de massa branca, molhadinho com calda de coco e coberto com coco ralado fresco, criando uma textura única e um sabor marcante.', 120.00, 'unidade', 1, 1, 'https://placehold.co/300x300/A16207/FFFFFF?text=Toalha+Felpuda', 7),
    (caseirinhos_id, 'Nega Maluca', 'caseirinho-nega-maluca', 'Bolo de chocolate fofinho e úmido com uma calda de chocolate cremosa, um clássico brasileiro que agrada a todas as gerações.', 120.00, 'unidade', 1, 1, 'https://placehold.co/300x300/A16207/FFFFFF?text=Nega+Maluca', 8),
    (caseirinhos_id, 'Laranja', 'caseirinho-laranja', 'Bolo caseiro de laranja, com uma massa fofinha e um leve toque cítrico, coberto com uma fina calda de açúcar para um acabamento perfeito.', 65.00, 'unidade', 1, 1, 'https://placehold.co/300x300/A16207/FFFFFF?text=Bolo+Laranja', 9);

    -- == Categoria: Lasanhas & Empadão ==
    INSERT INTO umenu_products (category_id, name, slug, description, price, pricing_type, min_quantity, step_quantity, image_url, display_order) VALUES
    (lasanhas_empadao_id, 'Lasanha de Frango', 'lasanha-frango', 'Camadas de massa fresca, recheio cremoso de frango desfiado e temperado, cobertas com molho branco aveludado e queijo gratinado.', 50.00, 'kg', 1, 0.5, 'https://placehold.co/300x300/EF4444/FFFFFF?text=Lasanha+Frango', 1),
    (lasanhas_empadao_id, 'Lasanha à Bolonhesa', 'lasanha-bolonhesa', 'A clássica lasanha italiana com camadas de massa, molho à bolonhesa rico e suculento, molho branco e queijo mussarela derretido.', 50.00, 'kg', 1, 0.5, 'https://placehold.co/300x300/EF4444/FFFFFF?text=Lasanha+Bolonhesa', 2),
    (lasanhas_empadao_id, 'Lasanha 4 Queijos', 'lasanha-4-queijos', 'Uma combinação irresistível de queijos (mussarela, provolone, parmesão e gorgonzola) entre camadas de massa fresca e molho branco cremoso.', 75.00, 'kg', 1, 0.5, 'https://placehold.co/300x300/EF4444/FFFFFF?text=Lasanha+4+Queijos', 3),
    (lasanhas_empadao_id, 'Empadão', 'empadao', 'Massa podre que derrete na boca com um recheio generoso e cremoso. Escolha entre o clássico frango com requeijão ou o delicado palmito.', 50.00, 'kg', 1, 0.5, 'https://placehold.co/300x300/EF4444/FFFFFF?text=Empadão', 4);

    RAISE NOTICE 'Menu completo inserido com sucesso!';

END $$;