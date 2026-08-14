-- Rode isso no SQL Editor do Supabase (depois da 016)
-- Recadastra as Categorias Abrangidas agrupadas de forma organizada,
-- com a lista detalhada (juridicamente completa) na descrição de
-- cada uma, exibida ao expandir o card no site.

insert into categorias (nome, icone, descricao, ordem) values
    ('Hospedagem', '🏨',
     'Hotéis, hotéis-fazenda, motéis, hospedarias, apart hotéis, casas de cômodos, flats, pensões, pousadas, resort, dormitórios e demais estabelecimentos de hospedagem em geral.',
     1),
    ('Restaurantes e Alimentação', '🍽️',
     'Restaurantes, buffets, rotisserias, cafeterias, salsicharias, buffets de café colonial, confeitarias, cafés, pizzarias, lanchonetes, leiterias, cantinas, casas de carnes assadas, churrascarias, fast-food, docerias, pastelarias, pamonharias, panquecarias, sorveterias e caldo-de-cana.',
     2),
    ('Bares e Vida Noturna', '🍺',
     'Bares, bares dançantes, boates, bomboniere, botequins, casa de chá, choperias, cabarés e taxi-girls.',
     3),
    ('Drive-in e Comércio Ambulante', '🚗',
     'Drive-in, estâncias, serv-car, trailers de lanches, carrinhos de cachorro-quente e carrinhos de água de coco e pipoca.',
     4),
    ('Comércio de Alimentos e Bebidas', '🛒',
     'Empresas que comercializam alimentação preparada em geral ao consumidor e no varejo, e empresas que comercializam bebidas alcoólicas ao consumidor e no varejo. Incluem-se os estabelecimentos anexos em hospitais, colégios, universidades, postos de combustíveis, supermercados e shopping centers, entre outros do gênero.',
     5);
