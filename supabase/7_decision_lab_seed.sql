-- ============================================================
-- SEED — cele 5 scenarii MVP pentru Decision Lab
-- Structura completă din conversație: fiecare scenariu are 5 decizii
-- succesive (nu doar una). Situația evoluează după fiecare alegere,
-- indiferent de opțiunea aleasă la pasul anterior — doar scorul și
-- feedback-ul diferă în funcție de alegere. La final: rezultat + scor.
--
-- Total: 5 scenarii × 5 noduri de decizie × 4 opțiuni = 100 opțiuni,
-- exact volumul estimat pentru Sprint 1 în conversația inițială.
--
-- Rulează după 6_decision_lab_schema.sql. Dacă ai rulat deja versiunea
-- veche (plată) a seed-ului, șterge întâi scenariile Decision Lab din
-- admin (/admin/decision-lab/) înainte de a rula acest fișier, ca să nu
-- rămână duplicate.
-- ============================================================

do $$
declare
  v_game_id uuid;
  v_scenario_id uuid;
  n1 uuid; n2 uuid; n3 uuid; n4 uuid; n5 uuid; vfinal uuid;
begin
  select id into v_game_id from games where slug = 'decision-lab';

  -- ============================================================
  -- Scenariul 1: Clientul important solicită o excepție
  -- ============================================================
  insert into decision_scenarios (game_id, title, description)
  values (v_game_id, 'Clientul important solicită o excepție',
    'Un client foarte valoros solicită aprobarea rapidă a unei excepții de la procedură.')
  returning id into v_scenario_id;

  insert into decision_nodes (scenario_id, node_text, is_root) values
    (v_scenario_id, 'Un client foarte valoros îți cere să aprobi rapid o excepție de la procedura standard. Presiunea e mare — clientul așteaptă un răspuns acum.', true)
    returning id into n1;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Clientul insistă și menționează că are o relație directă cu un membru din conducere. Simți presiune suplimentară să găsești o soluție rapidă.')
    returning id into n2;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Un coleg îți spune că, luna trecută, un caz similar a fost refuzat pentru un alt client. Te întrebi dacă tratamentul e echitabil.')
    returning id into n3;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Managementul cere un răspuns oficial în următoarea oră. Nu mai ai timp de investigații ample.')
    returning id into n4;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'A venit momentul să comunici oficial decizia către client, cu toate informațiile adunate până acum.')
    returning id into n5;
  insert into decision_nodes (scenario_id, node_text, is_final) values
    (v_scenario_id, 'Scenariul s-a încheiat. Scorul tău reflectă echilibrul dintre presiunea comercială, coerența deciziilor și verificarea faptelor de-a lungul procesului.', true)
    returning id into vfinal;

  insert into decision_choices (node_id, choice_text, next_node_id, score, feedback) values
    (n1, 'Aprobi imediat, fără verificări suplimentare', n2, -2, 'Ai prioritizat viteza, dar riști să ignori un semnal de risc.'),
    (n1, 'Ceri detalii suplimentare înainte să continui', n2, 2, 'Ai câștigat timp și informație, dar clientul devine nerăbdător.'),
    (n1, 'Anunți că vei consulta un coleg/superior', n2, 1, 'Decizia devine mai sigură, dar mai lentă.'),
    (n1, 'Refuzi ferm, invocând procedura', n2, -1, 'Ai fost consecvent, dar clientul simte că nu ești flexibil.'),

    (n2, 'Cedezi și grăbești aprobarea', n3, -2, 'Ai cedat presiunii ierarhice implicite, nu argumentelor de fond.'),
    (n2, 'Rămâi pe poziția inițială, explicând procesul', n3, 2, 'Ai menținut coerența deciziei, indiferent de presiune.'),
    (n2, 'Ceri să vezi confirmarea relației menționate', n3, 1, 'Ai verificat afirmația în loc s-o accepți necondiționat.'),
    (n2, 'Escaladezi imediat, ca să nu porți singur decizia', n3, 0, 'Eviți riscul personal, dar transferi problema mai departe.'),

    (n3, 'Ignori informația și continui cum ai decis', n4, -1, 'Riști o inconsecvență vizibilă între cazuri similare.'),
    (n3, 'Compari cele două cazuri înainte să continui', n4, 3, 'Ai verificat echitatea deciziei, nu doar contextul imediat.'),
    (n3, 'Menționezi diferența de context clientului', n4, 1, 'Ai fost transparent, dar discuția devine mai complicată.'),
    (n3, 'Presupui că există un motiv valid pentru diferență, fără să verifici', n4, -1, 'Ai acceptat o presupunere nesusținută de fapte.'),

    (n4, 'Trimiți un răspuns rapid, bazat pe ce știi acum', n5, 0, 'Ai respectat termenul, cu riscul unei decizii incomplete.'),
    (n4, 'Ceri o extindere scurtă a termenului pentru claritate', n5, 2, 'Ai prioritizat calitatea deciziei față de viteza formală.'),
    (n4, 'Delegi decizia finală managementului', n5, 1, 'Eviți riscul, dar nu preiei responsabilitatea deciziei.'),
    (n4, 'Iei decizia unilateral, fără să mai consulți pe nimeni', n5, -2, 'Viteză maximă, dar fără validare suplimentară.'),

    (n5, 'Comunici o aprobare condiționată, cu documente suplimentare cerute', vfinal, 3, 'Echilibrezi relația comercială cu prudența necesară.'),
    (n5, 'Comunici o aprobare completă, necondiționată', vfinal, -2, 'Riști să fi ignorat semnalele adunate pe parcurs.'),
    (n5, 'Comunici un refuz motivat, cu explicații clare', vfinal, 1, 'Decizie fermă, dar posibil percepută rigid de client.'),
    (n5, 'Amâni comunicarea, cerând mai mult timp de analiză', vfinal, -1, 'Prudent, dar clientul rămâne fără răspuns.');

  -- ============================================================
  -- Scenariul 2: E-mailul alarmant
  -- ============================================================
  insert into decision_scenarios (game_id, title, description)
  values (v_game_id, 'E-mailul alarmant',
    'Primești un e-mail prin care ești informat că un proiect important este în mare întârziere. Ai informații limitate.')
  returning id into v_scenario_id;

  insert into decision_nodes (scenario_id, node_text, is_root) values
    (v_scenario_id, 'Primești un e-mail alarmant: un proiect important pare a fi în mare întârziere. Informațiile din e-mail sunt vagi și nu ai context suplimentar.', true)
    returning id into n1;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Autorul e-mailului răspunde confuz, cu informații parțial contradictorii față de ce știai.')
    returning id into n2;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Descoperi că întârzierea reală e mai mică decât părea inițial, dar există un risc real pe o singură componentă critică.')
    returning id into n3;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Trebuie să decizi cum comunici situația reală către restul echipei, care încă crede că totul e grav.')
    returning id into n4;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Componenta critică e aproape rezolvată. E momentul unui raport final către cei care au fost inițial alarmați.')
    returning id into n5;
  insert into decision_nodes (scenario_id, node_text, is_final) values
    (v_scenario_id, 'Scenariul s-a încheiat. Scorul tău reflectă cât de bine ai verificat informația și ai recalibrat reacția pe măsură ce contextul s-a clarificat.', true)
    returning id into vfinal;

  insert into decision_choices (node_id, choice_text, next_node_id, score, feedback) values
    (n1, 'Contactezi direct autorul e-mailului', n2, 3, 'Ai mers direct la sursă înainte să reacționezi.'),
    (n1, 'Verifici datele din alte surse', n2, 2, 'Confirmarea încrucișată reduce riscul unei reacții greșite.'),
    (n1, 'Informezi imediat managementul', n2, -1, 'Reacție rapidă, dar bazată pe informații neverificate.'),
    (n1, 'Aștepți alte informații', n2, 0, 'Prudent, dar poți pierde timp prețios dacă situația e reală.'),

    (n2, 'Accepți prima explicație primită', n3, -1, 'Ai închis subiectul prea repede, fără verificare suplimentară.'),
    (n2, 'Ceri clarificări punctuale pe contradicții', n3, 3, 'Ai identificat exact ce nu se potrivește.'),
    (n2, 'Cauți o a doua sursă independentă', n3, 2, 'Ai triangulat informația în loc să te bazezi pe o singură voce.'),
    (n2, 'Presupui că explicația inițială e corectă și acționezi', n3, -2, 'Ai acționat pe baza unei informații neclarificate.'),

    (n3, 'Tratezi toată situația ca fiind critică, la fel ca la început', n4, -1, 'Reacție disproporționată față de informația actualizată.'),
    (n3, 'Recalibrezi urgența doar pe componenta critică', n4, 3, 'Ai ajustat reacția la informația nouă, nu la impresia inițială.'),
    (n3, 'Ignori riscul rămas, mulțumit că panica inițială a trecut', n4, -2, 'Riști să ignori exact partea reală de risc.'),
    (n3, 'Ceri o reevaluare completă, deși nu mai e necesară', n4, 0, 'Prudent, dar consumi resurse suplimentare inutil.'),

    (n4, 'Corectezi public informația, cu explicații clare', n5, 2, 'Ai realiniat percepția echipei la realitate.'),
    (n4, 'Lași impresia inițială necorectată', n5, -2, 'Riști ca echipa să ia decizii bazate pe informație greșită.'),
    (n4, 'Comunici doar persoanelor direct implicate', n5, 1, 'Informație corectă, dar acoperire parțială.'),
    (n4, 'Amâni comunicarea până la rezolvarea completă', n5, -1, 'Echipa rămâne cu percepția greșită mai mult decât e necesar.'),

    (n5, 'Raport transparent, cu cronologia completă a informațiilor', vfinal, 3, 'Transparența completă construiește încredere pe termen lung.'),
    (n5, 'Raport optimist, care minimizează cât de aproape de risc a fost situația', vfinal, -1, 'Riști să nu se învețe lecția reală din situație.'),
    (n5, 'Raport tehnic, fără context pentru non-tehnicieni', vfinal, 0, 'Corect, dar mai puțin util pentru decidenți non-tehnici.'),
    (n5, 'Nu trimiți niciun raport, considerând subiectul închis', vfinal, -2, 'Pierzi ocazia de a documenta o lecție utilă pentru viitor.');

  -- ============================================================
  -- Scenariul 3: Incidentul misterios
  -- ============================================================
  insert into decision_scenarios (game_id, title, description)
  values (v_game_id, 'Incidentul misterios',
    'Un proces care funcționa perfect de luni de zile s-a blocat brusc. Ai câteva indicii.')
  returning id into v_scenario_id;

  insert into decision_nodes (scenario_id, node_text, is_root) values
    (v_scenario_id, 'Un proces care funcționa perfect de luni de zile s-a blocat astăzi, brusc. Știi doar că ieri a fost implementată o modificare, dar au existat și alte modificări în paralel.', true)
    returning id into n1;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Prima ta acțiune nu a rezolvat complet problema. Simptomul reapare intermitent.')
    returning id into n2;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Descoperi două schimbări suspecte, aparent fără legătură directă, petrecute în aceeași fereastră de timp.')
    returning id into n3;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Ai identificat cauza cea mai probabilă. Trebuie să decizi cum o remediezi fără să afectezi alte părți ale sistemului.')
    returning id into n4;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Remedierea a fost aplicată. E momentul să documentezi incidentul pentru echipă.')
    returning id into n5;
  insert into decision_nodes (scenario_id, node_text, is_final) values
    (v_scenario_id, 'Scenariul s-a încheiat. Scorul tău reflectă rigoarea investigației și grija față de riscul remedierii aplicate.', true)
    returning id into vfinal;

  insert into decision_choices (node_id, choice_text, next_node_id, score, feedback) values
    (n1, 'Presupui că e ultima modificare', n2, 0, 'Concluzie rapidă, posibil corectă, dar neconfirmată.'),
    (n1, 'Analizezi toate modificările recente', n2, 3, 'Ai investigat sistematic înainte de a trage o concluzie.'),
    (n1, 'Repornești sistemul fără investigație', n2, -2, 'Rezolvi posibil simptomul, dar nu cauza.'),
    (n1, 'Ceri echipei tehnice să investigheze', n2, 1, 'Ai delegat corect, dar pierzi context direct.'),

    (n2, 'Concluzionezi că problema s-a rezolvat parțial, de ajuns', n3, -1, 'Riști să ignori un semnal recurent.'),
    (n2, 'Cauți un tipar în momentele când reapare simptomul', n3, 3, 'Ai căutat cauza, nu doar simptomul vizibil.'),
    (n2, 'Aplici din nou aceeași soluție ca prima dată', n3, -1, 'Repeți o acțiune fără să știi dacă a fost cauza reală.'),
    (n2, 'Ceri ajutor de la o persoană cu mai multă experiență pe acel sistem', n3, 2, 'Ai adus expertiză suplimentară în investigație.'),

    (n3, 'Alegi doar una dintre schimbări ca fiind cauza, pentru simplitate', n4, -1, 'Riști să ignori o cauză reală doar pentru claritate.'),
    (n3, 'Testezi izolat efectul fiecărei schimbări', n4, 3, 'Ai izolat variabilele înainte de a trage o concluzie.'),
    (n3, 'Presupui că ambele împreună sunt cauza, fără testare', n4, 0, 'Ipoteză plauzibilă, dar netestată.'),
    (n3, 'Anunți că nu poți determina cauza și renunți la investigație', n4, -2, 'Renunți înainte de a epuiza opțiunile rezonabile.'),

    (n4, 'Aplici remedierea direct în producție, fără testare', n5, -2, 'Viteză cu risc ridicat de efecte secundare.'),
    (n4, 'Testezi remedierea într-un mediu izolat înainte', n5, 3, 'Ai redus riscul unei remedieri care creează probleme noi.'),
    (n4, 'Ceri aprobare formală înainte de orice schimbare', n5, 1, 'Prudent, dar procesul devine mai lent.'),
    (n4, 'Amâni remedierea până la următoarea fereastră de mentenanță', n5, 0, 'Echilibrezi riscul, dar problema persistă mai mult.'),

    (n5, 'Documentezi complet cauza, investigația și soluția', vfinal, 3, 'Lecția devine utilă și pentru incidente viitoare similare.'),
    (n5, 'Documentezi doar soluția finală, fără investigație', vfinal, 0, 'Util pe termen scurt, dar pierzi contextul complet.'),
    (n5, 'Nu documentezi, considerând incidentul închis', vfinal, -2, 'Pierzi ocazia de a preveni recurența.'),
    (n5, 'Documentezi, dar exagerezi dificultatea investigației', vfinal, -1, 'Riști să distorsionezi percepția reală asupra incidentului.');

  -- ============================================================
  -- Scenariul 4: Clientul nemulțumit
  -- ============================================================
  insert into decision_scenarios (game_id, title, description)
  values (v_game_id, 'Clientul nemulțumit',
    'Clientul trimite un mesaj foarte critic. Primești doar mesajul, fără context.')
  returning id into v_scenario_id;

  insert into decision_nodes (scenario_id, node_text, is_root) values
    (v_scenario_id, 'Un client trimite un mesaj foarte critic despre serviciile primite. Nu ai niciun context suplimentar despre ce s-a întâmplat înainte.', true)
    returning id into n1;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Istoricul arată că într-adevăr a existat o întârziere reală în servirea clientului, dar și câteva încercări de comunicare ratate din partea echipei.')
    returning id into n2;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Clientul răspunde, încă supărat, dar deschis la o discuție dacă simte că e ascultat cu adevărat.')
    returning id into n3;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Ai ajuns la o înțelegere cu clientul. Trebuie să decizi ce comunici intern, echipei, despre acest incident.')
    returning id into n4;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'A trecut o săptămână. Clientul nu a mai revenit cu nemulțumiri, dar relația rămâne fragilă.')
    returning id into n5;
  insert into decision_nodes (scenario_id, node_text, is_final) values
    (v_scenario_id, 'Scenariul s-a încheiat. Scorul tău reflectă cât de bine ai echilibrat empatia, transparența și învățarea organizațională.', true)
    returning id into vfinal;

  insert into decision_choices (node_id, choice_text, next_node_id, score, feedback) values
    (n1, 'Răspunzi imediat, defensiv', n2, -2, 'Reacția emoțională poate escalada conflictul.'),
    (n1, 'Investighezi istoricul înainte să răspunzi', n2, 3, 'Ai separat faptele de emoție înainte de a acționa.'),
    (n1, 'Contactezi colegii implicați', n2, 1, 'Ai colectat context, dar răspunsul întârzie.'),
    (n1, 'Escaladezi direct', n2, -1, 'Eviți conflictul direct, dar clientul așteaptă un răspuns de la tine.'),

    (n2, 'Recunoști doar întârzierea, fără să menționezi comunicarea ratată', n3, 0, 'Parțial transparent, poate părea incomplet.'),
    (n2, 'Recunoști ambele probleme deschis', n3, 3, 'Transparența completă construiește încredere, chiar și în situații dificile.'),
    (n2, 'Minimizezi problema, sperând că se stinge de la sine', n3, -2, 'Riști să adânci nemulțumirea clientului.'),
    (n2, 'Redirecționezi responsabilitatea către alt departament', n3, -1, 'Clientul percepe lipsă de asumare.'),

    (n3, 'Oferi o soluție standard, fără să asculți detaliile lui', n4, -1, 'Riști să pară o rezolvare formală, nu una reală.'),
    (n3, 'Asculți activ înainte de a propune orice soluție', n4, 3, 'Ai prioritizat înțelegerea reală a problemei lui.'),
    (n3, 'Ceri timp suplimentar pentru o soluție mai bună', n4, 1, 'Rezonabil, dar clientul așteaptă deja de ceva timp.'),
    (n3, 'Propui o compensație generică, fără discuție', n4, -1, 'Poate părea o încercare de a închide subiectul rapid.'),

    (n4, 'Comunici deschis ce a mers greșit, ca lecție pentru echipă', n5, 3, 'Transformi incidentul într-o oportunitate de învățare.'),
    (n4, 'Nu comunici nimic, ca să eviți tensiuni interne', n5, -1, 'Pierzi ocazia de a preveni un incident similar.'),
    (n4, 'Comunici doar către persoana direct responsabilă', n5, 1, 'Corect, dar echipa nu învață din situație.'),
    (n4, 'Găsești un vinovat și îl faci public responsabil', n5, -2, 'Riști să creezi o cultură a fricii, nu a învățării.'),

    (n5, 'Faci un follow-up proactiv, ca să confirmi că totul e în regulă', vfinal, 3, 'Arăți grijă continuă, nu doar rezolvare punctuală.'),
    (n5, 'Aștepți ca el să revină dacă mai are nevoie de ceva', vfinal, 0, 'Pasiv, dar nu greșit.'),
    (n5, 'Consideri subiectul complet închis și treci mai departe', vfinal, -1, 'Riști să pierzi un semnal timpuriu dacă apare o problemă nouă.'),
    (n5, 'Oferi un beneficiu suplimentar, fără să fie cerut', vfinal, 1, 'Gest apreciat, deși nu strict necesar.');

  -- ============================================================
  -- Scenariul 5: Date contradictorii
  -- ============================================================
  insert into decision_scenarios (game_id, title, description)
  values (v_game_id, 'Date contradictorii',
    'Două surse oferă rezultate diferite pentru aceeași situație.')
  returning id into v_scenario_id;

  insert into decision_nodes (scenario_id, node_text, is_root) values
    (v_scenario_id, 'Două dashboard-uri arată rezultate diferite pentru aceeași situație: unul arată 90%, celălalt 72%. Ambele par corect configurate.', true)
    returning id into n1;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Descoperi că cele două surse folosesc perioade de referință diferite, ceea ce ar putea explica parțial diferența.')
    returning id into n2;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'După recalculare, diferența s-a redus, dar tot există un decalaj de câteva procente. Nu mai există o explicație evidentă.')
    returning id into n3;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'Ai identificat sursa exactă a decalajului rămas — o diferență mică, dar reală, de metodologie de calcul.')
    returning id into n4;
  insert into decision_nodes (scenario_id, node_text) values
    (v_scenario_id, 'E momentul să raportezi cifra finală și explicația către cei care au observat inițial discrepanța.')
    returning id into n5;
  insert into decision_nodes (scenario_id, node_text, is_final) values
    (v_scenario_id, 'Scenariul s-a încheiat. Scorul tău reflectă rigoarea cu care ai investigat discrepanța dintre surse, până la cauza ei reală.', true)
    returning id into vfinal;

  insert into decision_choices (node_id, choice_text, next_node_id, score, feedback) values
    (n1, 'Alegi sursa pe care o folosești de obicei', n2, -1, 'Confortabil, dar poți perpetua o eroare de metodologie.'),
    (n1, 'Verifici metodologia ambelor surse', n2, 3, 'Ai mers la rădăcina discrepanței.'),
    (n1, 'Ceri validare de la un terț', n2, 1, 'Decizie prudentă, dar necesită timp suplimentar.'),
    (n1, 'Construiești o concluzie combinată fără verificare', n2, -2, 'Riști să combini o eroare cu o informație corectă.'),

    (n2, 'Consideri asta explicația completă și închizi subiectul', n3, -1, 'Posibil incomplet — poate exista și altă cauză.'),
    (n2, 'Recalculezi ambele surse pe aceeași perioadă de referință', n3, 3, 'Ai eliminat o variabilă reală de confuzie.'),
    (n2, 'Menționezi observația, dar nu o testezi', n3, 0, 'Ipoteză corectă, dar netestată.'),
    (n2, 'Ignori observația, considerând-o nesemnificativă', n3, -2, 'Riști să ignori exact cauza reală a discrepanței.'),

    (n3, 'Accepți decalajul rămas ca fiind nesemnificativ', n4, 0, 'Rezonabil, dacă decalajul e într-adevăr mic.'),
    (n3, 'Verifici sursele de date brute din spatele fiecărui dashboard', n4, 3, 'Ai mers cât mai aproape de sursa primară a datelor.'),
    (n3, 'Alegi arbitrar una dintre cele două valori rămase', n4, -1, 'Decizie fără fundament clar.'),
    (n3, 'Ceri unei alte echipe să recalculeze independent', n4, 1, 'Validare suplimentară, dar consumă timp și resurse.'),

    (n4, 'Documentezi diferența și alegi sursa mai riguroasă', n5, 3, 'Decizie bazată pe înțelegerea completă a discrepanței.'),
    (n4, 'Ignori diferența, fiind prea mică pentru a conta', n5, -1, 'Poate fi corect, dar fără o justificare explicită.'),
    (n4, 'Ceri ca ambele surse să fie aliniate metodologic pe viitor', n5, 2, 'Previi apariția aceleiași confuzii în viitor.'),
    (n4, 'Renunți la unul din dashboard-uri fără explicație către echipă', n5, -2, 'Riști confuzie viitoare fără o comunicare clară.'),

    (n5, 'Raportezi cifra finală, cu explicația completă a discrepanței', vfinal, 3, 'Transparența completă previne neîncrederea viitoare în date.'),
    (n5, 'Raportezi doar cifra finală, fără explicație', vfinal, -1, 'Riști întrebări repetate pe viitor pentru aceeași discrepanță.'),
    (n5, 'Raportezi ambele cifre, lăsând pe alții să aleagă', vfinal, 0, 'Transferi decizia, în loc s-o asumi.'),
    (n5, 'Nu raportezi nimic, considerând subiectul închis intern', vfinal, -2, 'Pierzi ocazia de a clarifica public o confuzie reală.');

end $$;
