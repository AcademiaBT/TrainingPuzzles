-- ============================================================
-- SEED: Pool de categorii pentru jocul "Connections"
-- 36 categorii (10 yellow, 10 green, 8 blue, 8 purple) = 144 iteme
-- Rulează după schema.sql
-- ============================================================

insert into categories (game_id, title, tier, items, explanation)
select g.id, v.title, v.tier::tier_level, v.items, v.explanation
from games g,
(values
  -- ============================================================
  -- YELLOW — sinonime / atribute directe
  -- ============================================================
  ('Anotimpuri', 'yellow', array['PRIMĂVARA','VARA','TOAMNA','IARNA'], null),
  ('Puncte cardinale', 'yellow', array['NORD','SUD','EST','VEST'], null),
  ('Planete telurice', 'yellow', array['MERCUR','VENUS','PĂMÂNT','MARTE'], 'Cele 4 planete rocoase din interiorul sistemului solar'),
  ('Stări de agregare', 'yellow', array['SOLID','LICHID','GAZOS','PLASMĂ'], null),
  ('Instrumente cu coarde', 'yellow', array['VIOARĂ','CHITARĂ','HARPĂ','VIOLONCEL'], null),
  ('Fructe citrice', 'yellow', array['LĂMÂIE','PORTOCALĂ','GRAPEFRUIT','MANDARINĂ'], null),
  ('Sinonime pentru "fericit"', 'yellow', array['VESEL','BUCUROS','VOIOS','MULȚUMIT'], null),
  ('Piese de șah', 'yellow', array['REGE','REGINĂ','NEBUN','TURN'], null),
  ('Metale prețioase', 'yellow', array['AUR','ARGINT','PLATINĂ','PALADIU'], null),
  ('Animale de companie comune', 'yellow', array['CÂINE','PISICĂ','HAMSTER','IGUANĂ'], null),

  -- ============================================================
  -- GREEN — cunoștințe medii, mai specifice
  -- ============================================================
  ('Capitale europene mai puțin știute', 'green', array['LJUBLJANA','BRATISLAVA','VILNIUS','TALLINN'], null),
  ('Tipuri de pâine', 'green', array['BAGHETĂ','CIABATTA','FOCACCIA','PITA'], null),
  ('Instrumente de măsurat', 'green', array['RIGLA','RULETA','ȘUBLERUL','COMPASUL'], null),
  ('Dansuri latino', 'green', array['SALSA','BACHATA','RUMBA','CHA-CHA'], null),
  ('Părți ale unei cărți', 'green', array['COPERTA','COTORUL','PREFAȚA','INDEXUL'], null),
  ('Tipuri de nori', 'green', array['CUMULUS','STRATUS','CIRRUS','NIMBUS'], null),
  ('Părți ale ochiului', 'green', array['PUPILA','IRISUL','CORNEEA','RETINA'], null),
  ('Feline sălbatice', 'green', array['LEOPARD','JAGUAR','PUMA','GHEPARD'], null),
  ('Denumiri argou pentru bani', 'green', array['LOVELE','PARALE','BISTARI','GOLOGANI'], null),
  ('Tipuri de furtuni tropicale', 'green', array['TORNADĂ','URAGAN','TAIFUN','CICLON'], null),

  -- ============================================================
  -- BLUE — relații mai subtile, cunoștințe specifice
  -- ============================================================
  ('Componente de bază ale unui PC', 'blue', array['PLACA DE BAZĂ','PROCESORUL','MEMORIA RAM','SURSA'], null),
  ('Orașe care și-au schimbat numele', 'blue', array['ISTANBUL','SANKT PETERSBURG','MUMBAI','HO CHI MINH'], 'Fost Constantinopol, Leningrad, Bombay, Saigon'),
  ('Instrumente chirurgicale', 'blue', array['BISTURIU','PENSA','FOARFECA','ACUL'], null),
  ('Vânturi regionale cunoscute', 'blue', array['CRIVĂȚ','AUSTRU','BORA','MISTRAL'], null),
  ('Monede europene dinainte de euro', 'blue', array['LIRA','MARCA','FRANCUL','DRAHMA'], 'Italia, Germania, Franța, Grecia'),
  ('Părți ale unei corăbii', 'blue', array['CATARGUL','PUNTEA','CARENA','CÂRMA'], null),
  ('Figuri de stil', 'blue', array['METAFORA','PERSONIFICAREA','HIPERBOLA','COMPARAȚIA'], null),
  ('Foste capitale ale României', 'blue', array['IAȘI','TÂRGOVIȘTE','ALBA IULIA','BUCUREȘTI'], null),

  -- ============================================================
  -- PURPLE — wordplay / fill-in-the-blank
  -- ============================================================
  ('___ DE MARE', 'purple', array['STEA','CAL','ARICI','CASTRAVETE'], 'Stea de mare, cal de mare, arici de mare, castravete de mare'),
  ('___ DE CASĂ', 'purple', array['PÂINE','VIN','MÂNCARE','ANIMAL'], null),
  ('CAP DE ___', 'purple', array['RÂND','POD','AFIȘ','LISTĂ'], null),
  ('LOC DE ___', 'purple', array['PARCARE','JOACĂ','MUNCĂ','ODIHNĂ'], null),
  ('FOC DE ___', 'purple', array['ARTIFICII','TABĂRĂ','ARMĂ','PAIE'], null),
  ('APĂ DE ___', 'purple', array['PLOAIE','MARE','GURĂ','COLONIE'], null),
  ('OM DE ___', 'purple', array['ZĂPADĂ','AFACERI','ȘTIINȚĂ','CUVÂNT'], null),
  ('CARTE DE ___', 'purple', array['JOC','VIZITĂ','IDENTITATE','MUNCĂ'], null)

) as v(title, tier, items, explanation)
where g.slug = 'connections';

-- ============================================================
-- Verificare rapidă după rulare
-- ============================================================
-- select tier, count(*) from categories group by tier order by tier;
-- ar trebui să dea: yellow=10, green=10, blue=8, purple=8
