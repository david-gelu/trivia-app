const fs = require('fs')
const { generateAll } = require('./generators')

const targetCount = 10000
const difficulties = ['Începător', 'Intermediar', 'Expert']

const catalog = [
  {
    category: 'JavaScript',
    facts: [
      { term: 'let', answer: 'are scope de bloc și poate fi reasignată', distractors: ['este global pentru tot proiectul', 'nu poate fi reasignată niciodată', 'este disponibil doar în browser'] },
      { term: 'const', answer: 'definește o referință constantă, dar obiectele pot fi mutate', distractors: ['blochează orice modificare în obiect', 'nu poate fi folosită în funcții', 'este mereu globală'] },
      { term: 'var', answer: 'are scope funcțional și este hoisted', distractors: ['are scope de bloc', 'nu poate fi declarată niciodată', 'este disponibilă doar în Node.js'] },
      { term: 'hoisting', answer: 'mută declarările funcțiilor și variabilelor în faza de compilare', distractors: ['rulează codul înainte de execuție', 'închide toate variabilele', 'forțează async/await'] },
      { term: 'closure', answer: 'permite funcției să acceseze variabile din mediul exterior', distractors: ['afectează doar HTML-ul', 'oprește timpul de execuție', 'transformă codul în CSS'] },
      { term: 'async/await', answer: 'simplifică lucrul cu Promises și cod asincron', distractors: ['înlocuiește complet JavaScript-ul', 'nu funcționează în browser', 'transformă toate funcțiile în variabile globale'] },
      { term: 'Promise', answer: 'reprezintă o operațiune asincronă care va avea un rezultat viitor', distractors: ['este un tip de CSS', 'este o resursă de server', 'este un obiect pentru DOM'] },
      { term: 'event loop', answer: 'gestionează execuția task-urilor și callback-urilor în JavaScript', distractors: ['rulează tot codul în paralel', 'împachetează CSS-ul', 'înlocuiește browser-ul'] },
      { term: 'map()', answer: 'transformă fiecare element dintr-un array și returnează un nou array', distractors: ['șterge elementele din array', 'transformă obiectele în string', 'adaugă un nou element la final'] },
      { term: 'reduce()', answer: 'agregă valorile unui array într-o singură valoare', distractors: ['clonează array-ul', 'filtrează în funcție de paritate', 'întoarce doar indexurile'] },
      { term: 'filter()', answer: 'păstrează doar elementele care respectă condiția', distractors: ['transformă rezultatul în numărul de elemente', 'adaugă duplicate', 'ieșește doar din valori numerice'] },
      { term: 'this', answer: 'se leagă de contextul de execuție al funcției', distractors: ['este mereu nodul HTML', 'este constant în toate contextele', 'nu există în strict mode'] },
      { term: 'prototype', answer: 'permite moștenirea și adăugarea de metode la obiecte', distractors: ['este un tip de CSS grid', 'este compatibil doar cu HTML', 'dezactivează obiectele'] },
      { term: 'strict mode', answer: 'afișează mai multe erori și previne comportamente periculoase', distractors: ['oprește complet JavaScript-ul', 'încetinește extragerea de date', 'dezactivează obiectele din browser'] },
      { term: 'spread operator', answer: 'extinde elementele unui array sau obiect în alt context', distractors: ['stochează codul într-o variabilă', 'transformă CSS-ul în JavaScript', 'creează un nou DOM'] },
      { term: 'destructuring', answer: 'extrage rapid valori din array-uri sau obiecte', distractors: ['împachetează codul CSS', 'anulează toate variabilele', 'creează în mod automat fetch-ul'] },
      { term: 'rest parameters', answer: 'permit captarea mai multor argumente într-un array', distractors: ['împiedică apelurile de funcție', 'mărește viteza de compilare', 'adaugă variabile globale'] },
      { term: 'fetch()', answer: 'trimite cereri HTTP de la browser către un server', distractors: ['creează doar CSS-ul', 'rulează pe server fără internet', 'este înlocuitorul lui React'] },
      { term: 'JSON.stringify()', answer: 'transformă un obiect JavaScript într-un string JSON', distractors: ['convertește CSS în obiect', 'transformă HTML în date', 'șterge proprietățile din obiect'] },
      { term: 'JSON.parse()', answer: 'transformă un string JSON într-un obiect JavaScript', distractors: ['citește doar fișiere locale', 'transformă obiectele în CSS', 'creează noduri DOM'] },
      { term: 'try/catch', answer: 'prinde și gestionează erorile din blocul de cod', distractors: ['intră în buclă infinită', 'creează un nou browser', 'este folosit numai pentru CSS'] },
      { term: 'Symbol', answer: 'este un tip primitiv unic folosit pentru chei rare', distractors: ['este un tip de HTML', 'este folosit exclusiv pentru backend', 'este doar un operator matematic'] },
      { term: 'Set', answer: 'păstrează valori unice fără duplicate', distractors: ['salvează doar elemente numerice', 'conține doar obiecte', 'este un tip de CSS'] },
      { term: 'WeakMap', answer: 'stochează chei obiect și le eliberează automat când nu mai sunt folosite', distractors: ['este folosit pentru stiluri', 'salvează date pe server', 'este un container DOM'] },
      { term: 'Array.from()', answer: 'transformă elemente iterabile într-un array real', distractors: ['printează HTML-ul', 'șterge toate datele', 'convertește CSS în JSON'] },
      { term: 'Object.keys()', answer: 'returnează cheile enumerabile ale unui obiect', distractors: ['returnează doar valorile', 'creează un nou browser', 'filtrează DOM-ul'] },
      { term: 'Object.freeze()', answer: 'îngheață un obiect, împiedicând modificările din exterior', distractors: ['împinge obiectul în server', 'mărește dimensiunea lui', 'nu are niciun efect'] },
      { term: 'debounce', answer: 'întârzie execuția unei funcții până după o perioadă de inactivitate', distractors: ['rulează funcția de 1000 de ori', 'transformă datele în JSON', 'blochează toate apelurile HTTP'] },
      { term: 'throttle', answer: 'limitează frecvența execuției unei funcții', distractors: ['oprește complet obiectele', 'face fetch automat', 'modifică CSS-ul'] },
      { term: 'module.exports', answer: 'expune variabile și funcții pentru a fi folosite în alte fișiere', distractors: ['stochează date doar în browser', 'este o sintaxă CSS', 'nu funcționează în Node.js'] },
      { term: 'import/export', answer: 'permit împărțirea codului între module diferite', distractors: ['transformă HTML în CSS', 'nu funcționează decât în browser', 'sunt doar pentru backend'] },
      { term: 'IIFE', answer: 'rulează o funcție imediat după declarare, fără a polua scope-ul global', distractors: ['este un tip de shadow DOM', 'crește dimensiunea CSS-ului', 'este folosit exclusiv pentru backend'] },
      { term: 'class', answer: 'definește un șablon pentru obiecte cu proprietăți și metode', distractors: ['este doar pentru stilizare', 'nu poate fi instanțiat', 'este folosită doar în HTML'] },
      { term: 'for...of', answer: 'iterează peste valorile iterabile, precum array-uri și string-uri', distractors: ['iterează doar prin chei', 'rulează doar în CSS', 'nu este disponibil în Node.js'] },
      { term: 'for...in', answer: 'iterează peste cheile enumerabile ale unui obiect', distractors: ['iterează peste valorile din array', 'nu poate fi folosit pentru obiecte', 'transformă obiectele în string'] },
      { term: 'nullish coalescing', answer: 'returnează operandul din dreapta când valoarea din stânga este null sau undefined', distractors: ['returnează mereu valoarea din stânga', 'transformă într-un array', 'se folosește în CSS'] },
      { term: 'optional chaining', answer: 'permite accesarea sigură a proprietăților fără verificări repetitive', distractors: ['blochează toate apelurile', 'înlocuiește try/catch', 'se aplică doar la CSS'] },
      { term: 'template literals', answer: 'permit interpolarea de valori în string-uri cu ${}', distractors: ['sunt folosite doar pentru CSS', 'nu acceptă expresii', 'funcționează doar în server'] },
      { term: 'localStorage', answer: 'salvează date în browser, fără dată de expirare', distractors: ['salvează doar date secrete pe server', 'nu poate fi citit', 'este un tip de font'] },
      { term: 'Array.prototype.flat()', answer: 'aplatizează un array imbricat într-un array mai simplu', distractors: ['adaugă valori la început', 'clonează obiectul', 'este folosit doar în DOM'] },
      { term: 'BigInt', answer: 'reprezintă numere întregi fără limită de dimensiune', distractors: ['reprezintă doar numere zecimale', 'este compatibil doar cu CSS', 'este folosit pentru culoare'] },
    ],
  },
  {
    category: 'CSS',
    facts: [
      { term: 'flexbox', answer: 'aliniază și distribuie elementele într-un container pe axe orizontală și verticală', distractors: ['este folosit doar pentru imagini', 'creează animații', 'nu poate poziționa elemente'] },
      { term: 'grid', answer: 'permite structurarea layout-ului în linii și coloane', distractors: ['suplantează complet HTML-ul', 'gestionează doar culorile', 'nu funcționează în browser'] },
      { term: 'position: sticky', answer: 'păstrează un element fix relativ la containerul părinte', distractors: ['face un element invizibil', 'se mărește automat', 'nu poate fi folosit cu scroll'] },
      { term: 'box-sizing: border-box', answer: 'include padding-ul și border-ul în dimensiunea totală a elementului', distractors: ['exclude bordura din calcul', 'fixează doar culoarea', 'nu lucrează cu width'] },
      { term: 'media query', answer: 'aplică stiluri diferite în funcție de rezoluția sau orientarea ecranului', distractors: ['descarcă imagini din internet', 'schimbă doar textul', 'conține exclusiv reguli de JavaScript'] },
      { term: 'pseudo-class :hover', answer: 'aplică stiluri atunci când utilizatorul trece mouse-ul peste element', distractors: ['oprește randarea elementului', 'activează automat animația', 'rulează numai pe server'] },
      { term: 'pseudo-element ::before', answer: 'inserează conținut vizual înaintea conținutului elementului', distractors: ['șterge elementul din HTML', 'adaugă un nou tag script', 'nu poate insera text'] },
      { term: 'custom properties', answer: 'permit stocarea valorilor reutilizabile în variabile CSS', distractors: ['sunt folosite doar în JavaScript', 'nu pot fi modificate', 'sunt echivalente cu HTML'] },
      { term: 'transition', answer: 'animă trecerea unei proprietăți între două stări', distractors: ['face ca toate elementele să fie invizibile', 'funcționează doar în Node.js', 'nu suportă proprietăți'] },
      { term: 'animation', answer: 'permite secvențe de stil animate definite prin @keyframes', distractors: ['creează doar texte statice', 'este o proprietate JavaScript', 'nu poate fi declanșată'] },
      { term: 'aspect-ratio', answer: 'menține proporțiile unui element independent de dimensiunile sale', distractors: ['setează doar înălțimea', 'obligă codul să fie CSS-only', 'nu funcționează cu flex'] },
      { term: 'clamp()', answer: 'limitează o valoare între minimum și maximum, cu o dimensiune fluidă', distractors: ['împiedică orice animație', 'convertește culorile în fonturi', 'este doar pentru imagini'] },
      { term: 'minmax()', answer: 'setează intervale flexibile pentru dimensiunile din grid', distractors: ['dezactivează gap-ul', 'creează doar linii imaginare', 'are rol în JavaScript'] },
      { term: 'gap', answer: 'controlează spațiul dintre elementele din flex sau grid', distractors: ['mărește doar textul', 'face elementele invizibile', 'este folosit exclusiv pentru backend'] },
      { term: 'z-index', answer: 'stabilește ordinea de suprapunere a elementelor', distractors: ['controlează doar culori', 'intră automat în loop infinit', 'nu are efect'] },
      { term: 'overflow', answer: 'controlează ce se întâmplă cu conținutul ce depășește dimensiunea elementului', distractors: ['mută textul în JavaScript', 'nu poate fi folosit în layout', 'dezactivează flexbox-ul'] },
      { term: 'object-fit', answer: 'reglează modul în care o imagine se întinde sau se potrivește în container', distractors: ['modifică doar schema de culori', 'afectează doar textul', 'este funcție de Node.js'] },
      { term: 'calc()', answer: 'permite calculul valorilor CSS din expresii matematice', distractors: ['înlocuiește toate variabilele', 'nu funcționează decât în JavaScript', 'este doar pentru imagini'] },
      { term: 'linear-gradient()', answer: 'generează un degradat liniar de culori', distractors: ['setează mărimea fontului', 'convertește CSS în SVG', 'nu poate fi folosit ca fundal'] },
      { term: 'conic-gradient()', answer: 'creează un degradat circular în funcție de unghi', distractors: ['este folosit numai pentru animație', 'golește containerul', 'nu suportă culori'] },
      { term: 'backdrop-filter', answer: 'aplică efecte de blur sau de culoare în spatele unui element', distractors: ['este un atribut HTML', 'afectează doar fonturile', 'nu poate fi folosit la fundal'] },
      { term: 'contain', answer: 'limitează efectele layout-ului și stilizării doar în interiorul elementului', distractors: ['transformă codul în JavaScript', 'nu poate fi folosit cu div-uri', 'deblochează complet layout-ul'] },
      { term: 'will-change', answer: 'anunță browser-ul că un element va suferi modificări viitoare', distractors: ['împiedică orice schimbare', 'face toate elementele fixe', 'este doar pentru backend'] },
      { term: 'mask-image', answer: 'maschează vizibilitatea unei imagini sau a unui element', distractors: ['este un tip de font', 'schimbă direct DOM-ul', 'nu funcționează în CSS modern'] },
      { term: 'min-height', answer: 'limitează înălțimea minimă a unui element', distractors: ['setează doar lățimea', 'creează imagini animate', 'nu are niciun efect'] },
      { term: 'max-width', answer: 'limitează lățimea maximă a unei componente', distractors: ['este doar pentru margini', 'șterge scroll-ul', 'nu funcționează în flex'] },
      { term: '@keyframes', answer: 'definește etapele unei animații CSS', distractors: ['setează doar culorile', 'împiedică browserul să randeze', 'este folosit doar în JavaScript'] },
      { term: 'transform', answer: 'poate translata, roti, scala sau înclina un element', distractors: ['setează doar culoarea', 'nu poate afecta layout-ul', 'funcționează exclusiv în Node.js'] },
      { term: 'filter', answer: 'aplică efecte vizuale precum blur, grayscale sau contrast', distractors: ['modifică doar culorile de text', 'nu este suportat în browser', 'este folosit doar pentru backend'] },
      { term: 'border-radius', answer: 'rotunjește colțurile unui element', distractors: ['setează doar grosimea marginii', 'are rol numai în flex', 'nu poate fi folosit la boxe'] },
      { term: 'drop-shadow', answer: 'adaugă o umbră vizuală la un element', distractors: ['este folosit în JavaScript', 'face obiectul transparent', 'nu poate fi folosit cu text'] },
      { term: 'scroll-behavior', answer: 'controlează animarea de derulare între ancoraje și scroll', distractors: ['oprește total scroll-ul', 'face toate imaginile fixe', 'este un atribut JavaScript'] },
    ],
  },
  {
    category: 'React',
    facts: [
      { term: 'useState', answer: 'gestionează starea locală a unei componente', distractors: ['creează automat route-uri', 'salvează date în baza de date', 'este doar pentru server'] },
      { term: 'useEffect', answer: 'rulează efecte după render și poate răspunde la schimbări', distractors: ['comută direct CSS-ul', 'nu poate folosi dependențe', 'este folosit exclusiv pentru backend'] },
      { term: 'useMemo', answer: 'memoizează o valoare costisitoare pentru a evita recalcularea inutilă', distractors: ['creează constante globale', 'împachetează HTML-ul', 'nu are niciun efect pe render'] },
      { term: 'useCallback', answer: 'memoizează o funcție pentru a evita recrearea ei la fiecare render', distractors: ['convertește funcțiile în CSS', 'creează stări globale', 'nu poate fi folosit în componentă'] },
      { term: 'useRef', answer: 'păstrează o referință mutabilă peste cicluri de render', distractors: ['stochează doar culorile', 'este doar pentru backend', 'nu poate fi folosit pe DOM'] },
      { term: 'key prop', answer: 'ajută React să identifice elementele dintr-o listă și să le re-randeze corect', distractors: ['este folosit pentru stilizare', 'face lista să se rupă', 'este un atribut CSS'] },
      { term: 'virtual DOM', answer: 'reprezintă o copie a DOM-ului folosită pentru optimizări de render', distractors: ['este un server intern', 'este doar HTML', 'nu are legătură cu UI'] },
      { term: 'controlled component', answer: 'folosește starea React pentru a controla valoarea unui input', distractors: ['este un element non-HTML', 'nu poate avea stări', 'este echivalent cu CSS'] },
      { term: 'uncontrolled component', answer: 'lasă DOM-ul să gestioneze starea internă a input-ului', distractors: ['nu apare în React', 'este doar pentru backend', 'împiedică toate inputurile'] },
      { term: 'props', answer: 'sunt date transmise de la un părinte către un copil', distractors: ['sunt doar variabile interne', 'sunt date de server', 'nu pot fi transmise'] },
      { term: 'state', answer: 'stochează date locale care pot declanșa re-render-ul componentei', distractors: ['se salvează doar în DB', 'nu poate fi schimbat', 'este echivalent cu variabilele CSS'] },
      { term: 'lifting state up', answer: 'mută starea într-o componentă părinte pentru a fi partajată', distractors: ['șterge starea locală', 'mărește automat viteza', 'nu este recomandat'] },
      { term: 'Fragment', answer: 'permite gruparea mai multor noduri fără a adăuga un container suplimentar', distractors: ['adaugă un container div', 'nu evaluează codul', 'este un tag CSS'] },
      { term: 'ErrorBoundary', answer: 'prinde erori din arborele de componente și afișează fallback', distractors: ['este un tip de formular', 'nu poate prinde erori', 'este doar pentru backend'] },
      { term: 'Suspense', answer: 'gestionează încărcarea asincronă a componentelor și fallback-urile', distractors: ['nu poate încărca date', 'este un tip de router', 'împiedică orice fetch'] },
      { term: 'React.lazy()', answer: 'încarcă o componentă doar la momentul în care este necesară', distractors: ['încarcă totul deodată', 'este doar pentru CSS', 'nu funcționează în React'] },
      { term: 'memo()', answer: 'previne re-render-ul inutil al unei componente dacă props-urile nu s-au schimbat', distractors: ['blochează toate render-urile', 'schimbă direct starea', 'nu poate fi folosit pentru componente'] },
      { term: 'Portal', answer: 'randează un element într-un container diferit din arborele DOM al aplicației', distractors: ['este un engine de backend', 'este un tip de rută', 'nu are legătură cu UI'] },
      { term: 'Context API', answer: 'permite transmiterea datelor fără a le pasa manual prin props', distractors: ['este o metodă CSS', 'nu are legătură cu state-ul', 'se folosește doar în server'] },
      { term: 'useReducer', answer: 'gestionează stări complexe folosind un reducer', distractors: ['este echivalent cu fetch', 'nu poate fi folosit pe obiecte', 'este doar pentru formulare'] },
      { term: 'Rules of Hooks', answer: 'stabilește că hook-urile trebuie apelate în aceeași ordine și la nivelul corect', distractors: ['sunt reguli CSS', 'definesc HTML-ul', 'opresc orice componentă'] },
      { term: 'StrictMode', answer: 'activează verificări suplimentare pentru detectarea efectelor duble în dezvoltare', distractors: ['dezactivează toate erorile', 'este un modul de CSS', 'nu există în React'] },
      { term: 'immutability', answer: 'înseamnă că datele nu sunt mutate direct, ci create din nou', distractors: ['este un tip de fetch', 'oprește toate stările', 'este doar o regulă CSS'] },
      { term: 'server-side rendering', answer: 'generează HTML pe server înainte de a livra pagina în browser', distractors: ['rulează doar în client', 'nu poate fi folosit la React', 'este doar pentru backend'] },
      { term: 'client-side rendering', answer: 'generează interfața în browser după încărcarea aplicației', distractors: ['generează datele în baza de date', 'este exclusiv server-side', 'nu folosește DOM-ul'] },
      { term: 'React Router', answer: 'permite navigarea între rute fără refresh complet al paginii', distractors: ['este un framework CSS', 'este exclusiv pentru backend', 'nu gestionează URL-uri'] },
      { term: 'controlled form', answer: 'starea formularului este sincronizată cu state-ul React', distractors: ['nu poate valida input-uri', 'nu are validare', 'este doar un element HTML'] },
      { term: 'uncontrolled form', answer: 'formularul folosește DOM-ul pentru starea internă', distractors: ['nu poate exista în React', 'este un tip de CSS', 'nu acceptă input-uri'] },
      { term: 'useId', answer: 'generează identificatori stabili pentru elementele UI în React', distractors: ['generează doar culori', 'formatează șiruri CSS', 'nu poate fi folosit în componentă'] },
      { term: 'useTransition', answer: 'permite marcarea unor update-uri ca fiind non-urgente pentru UI', distractors: ['împiedică orice render', 'este o metodă CSS', 'nu poate fi folosit în frontend'] },
      { term: 'startTransition', answer: 'marchează o actualizare ca fiind de prioritate mai scăzută pentru UI', distractors: ['oprește re-render-ul', 'este doar pentru server', 'nu are legătură cu React'] },
    ],
  },
  {
    category: 'MongoDB',
    facts: [
      { term: 'find()', answer: 'citește documente dintr-o colecție conform unui filtru', distractors: ['șterge documente', 'inserează date în SQL', 'nu se aplică colecțiilor'] },
      { term: 'aggregate()', answer: 'procesează date prin pipeline-uri de transformare și grupare', distractors: ['reinițializează colecția', 'este folosit doar pentru CSS', 'nu acceptă filtre'] },
      { term: '$match', answer: 'filtrează documentele dintr-un pipeline de agregare', distractors: ['schimbă schema colecției', 'creează o nouă bază de date', 'nu are legătură cu MongoDB'] },
      { term: '$group', answer: 'grupează documentele după chei și calculează agregări', distractors: ['scrie direct pe disc', 'este folosit doar în PostgreSQL', 'este un tip de index'] },
      { term: '$sort', answer: 'ordonează documentele rezultate într-un pipeline', distractors: ['întoarce numai valorile unice', 'creează noi colecții', 'nu funcționează cu agregare'] },
      { term: '$lookup', answer: 'realizează un join între colecții', distractors: ['copiază colecția în memorie', 'împarte datele în două baze', 'este o comandă SQL'] },
      { term: '$project', answer: 'selectează și transformă câmpurile din documentele rezultate', distractors: ['șterge toate documentele', 'creează indexuri', 'nu poate fi folosit în agregare'] },
      { term: '_id', answer: 'este identificatorul unic al unui document', distractors: ['este o colecție de indecși', 'este un câmp SQL', 'este echivalent cu TTL'] },
      { term: 'ObjectId', answer: 'este tipul implicit de identificator unic pentru documente', distractors: ['este un tip de CSS', 'este un tip de query SQL', 'este echivalent cu string-ul'] },
      { term: 'index', answer: 'accelerează căutările prin stabilirea unei structuri de acces', distractors: ['mărește timpul de inserare fără efect', 'este doar pentru JavaScript', 'nu are legătură cu datele'] },
      { term: 'TTL index', answer: 'șterge automat documentele după o perioadă de timp', distractors: ['blochează toate operațiile de scriere', 'este doar pentru Node.js', 'nu există în MongoDB'] },
      { term: 'sharding', answer: 'împarte datele pe mai multe servere pentru scalabilitate', distractors: ['clonează datele în memorie', 'este o tehnică CSS', 'nu are legătură cu DB'] },
      { term: 'replica set', answer: 'replică datele pe mai multe noduri pentru redundanță și disponibilitate', distractors: ['este o structură de HTML', 'este un tip de cache', 'nu poate fi folosit pentru MongoDB'] },
      { term: 'embedded document', answer: 'înglobează datele legate direct în același document', distractors: ['se salvează exclusiv în fișiere', 'este echivalent cu un index', 'înlocuiește colecțiile'] },
      { term: 'denormalization', answer: 'duplică date pentru a reduce costurile de join și query-uri', distractors: ['creează doar noduri CSS', 'elimină datele repetate', 'este o tehnică de frontend'] },
      { term: 'projection', answer: 'selectează doar câmpurile necesare dintr-un document', distractors: ['împiedică conectarea la server', 'creează un nou index', 'nu există în query-uri'] },
      { term: 'cursor', answer: 'reprezintă rezultatul iterabil al unei interogări MongoDB', distractors: ['este un obiect de CSS', 'este doar o variabilă JavaScript', 'este un folder de date'] },
      { term: 'upsert', answer: 'actualizează un document dacă există și îl creează dacă nu există', distractors: ['șterge automat datele', 'împiedică toate update-urile', 'nu există în MongoDB'] },
      { term: 'writeConcern', answer: 'definește nivelul de confirmare pentru operațiile de scriere', distractors: ['setează comenzi SQL', 'înlocuiește schema CSS', 'nu se aplică datelor'] },
      { term: 'readConcern', answer: 'controlează nivelul de consistență al citirii datelor', distractors: ['înlocuiește indexul', 'reglează proiectarea CSS', 'este doar pentru cache'] },
      { term: 'mongosh', answer: 'este shell-ul interactiv pentru MongoDB', distractors: ['este un framework React', 'este o librărie CSS', 'este un server web'] },
      { term: 'transactions', answer: 'asigură atomicitatea mai multor operații de scriere', distractors: ['elimină toate datele', 'sunt disponibile doar în CSS', 'nu sunt suportate în MongoDB'] },
      { term: 'GridFS', answer: 'stochează fișiere mari împărțite în documente MongoDB', distractors: ['împachetează CSS', 'verifică viteza HTTP', 'nu are legătură cu datele'] },
      { term: 'schema validation', answer: 'impune reguli asupra structurii documentelor', distractors: ['înregistrează CSS în browser', 'blochează toate colecțiile', 'nu evaluează datele'] },
      { term: 'compound index', answer: 'creează un index peste mai multe câmpuri pentru query-uri complexe', distractors: ['este un tip de thread JavaScript', 'este un șablon CSS', 'este folosit doar pentru text'] },
      { term: 'partial index', answer: 'creează un index doar pentru un subset de documente', distractors: ['indexează toate datele global', 'nu are legătură cu MongoDB', 'este un tip de fetch'] },
      { term: 'text index', answer: 'permite căutări de text complet pe câmpurile indexate', distractors: ['înlocuiește toate interogările', 'este un tip de CSS grid', 'nu poate căuta text'] },
      { term: 'geospatial index', answer: 'optimizează query-urile bazate pe coordonate geografice', distractors: ['nu funcționează niciodată', 'este pentru cache', 'se folosește doar în browser'] },
      { term: 'change streams', answer: 'permit monitorizarea în timp real a evenimentelor din colecții', distractors: ['sunt activate doar în CSS', 'nu există în MongoDB', 'se folosesc doar pentru serverless'] },
      { term: 'read preference', answer: 'stabilește de unde se citesc datele, de la primar sau secundar', distractors: ['controlează culorile din UI', 'schimbă datele de tip text', 'nu există în MongoDB'] },
    ],
  },
  {
    category: 'PostgreSQL',
    facts: [
      { term: 'PRIMARY KEY', answer: 'identifică unic fiecare rând din tabel', distractors: ['este o cheie de acces CSS', 'permite duplicate nelimitate', 'este doar pentru loguri'] },
      { term: 'FOREIGN KEY', answer: 'stabilește o relație între două tabele printr-o coloană', distractors: ['cartografiază doar stilurile', 'este echivalent cu un index', 'nu are legătură cu datele'] },
      { term: 'UNIQUE', answer: 'impune valori distincte în cadrul unei coloane sau a unei combinații', distractors: ['permite duplicate', 'se aplică doar la text', 'nu poate fi folosit în SQL'] },
      { term: 'INDEX', answer: 'îmbunătățește viteza de căutare pentru coloanele interogate frecvent', distractors: ['scade performanța și crește datele', 'este un concept CSS', 'nu are efect la query-uri'] },
      { term: 'VACUUM', answer: 'curăță spațiul nefolosit și menține performanța bazei de date', distractors: ['șterge toate tabelele', 'împiedică toate query-urile', 'este un tip de cache al browserului'] },
      { term: 'ANALYZE', answer: 'actualizează statisticile folosite de planner-ul de query-uri', distractors: ['înlocuiește schema', 'stabilește CSS-ul', 'nu poate fi apelat în SQL'] },
      { term: 'JOIN', answer: 'combină rânduri din tabele diferite pe baza unei condiții', distractors: ['creează CSS-uri', 'nu există în SQL', 'elimină duplicatele'] },
      { term: 'CTE', answer: 'permite definirea unor subquery-uri reutilizabile în cadrul unei interogări', distractors: ['este doar pentru Node.js', 'este o clasă JavaScript', 'nu este disponibilă în PostgreSQL'] },
      { term: 'transaction', answer: 'grupează mai multe operații astfel încât să fie ori toate aplicate, ori toate anulate', distractors: ['întrerupe script-ul', 'este un tip de CSS', 'nu are legătură cu datele'] },
      { term: 'MVCC', answer: 'permite PostgreSQL să gestioneze simultaneitatea fără blocaje mari', distractors: ['oprește toate conexiunile', 'este un tip de frontend', 'este un sistem de CSS'] },
      { term: 'EXPLAIN', answer: 'afișează planul de execuție al unei query-uri', distractors: ['afișează doar codul CSS', 'șterge rezultatul query-ului', 'nu există în SQL'] },
      { term: 'JSONB', answer: 'stochează date JSON în format binar, optimizat pentru interogare', distractors: ['este un tip CSS', 'este folosit doar pentru sesiuni', 'nu poate conține obiecte'] },
      { term: 'GIN index', answer: 'este folosit pentru indexarea eficientă a datelor JSONB și text', distractors: ['este un tip de CSS', 'este înlocuitorul lui React', 'nu are legătură cu baze de date'] },
      { term: 'BRIN index', answer: 'este eficient pentru tabele mari în care datele sunt ordonate logic', distractors: ['nu poate fi folosit în PostgreSQL', 'este doar pentru cache', 'este folosit exclusiv în Node.js'] },
      { term: 'ILIKE', answer: 'face căutări textuale case-insensitive', distractors: ['face căutări doar numerice', 'este o cheie CSS', 'este echivalent cu regex only'] },
      { term: 'CASE', answer: 'permite evaluarea condițională a valorilor într-o query', distractors: ['este o regulă de CSS', 'este un tip de fetch', 'nu funcționează în SQL'] },
      { term: 'COALESCE', answer: 'returnează primul operand nenul dintr-o listă', distractors: ['returnează ultimul operand', 'este un tip de server', 'nu acceptă valori null'] },
      { term: 'NULLIF', answer: 'returnează NULL dacă două valori sunt egale', distractors: ['returnează mereu valoarea din stânga', 'este un tip de index', 'nu are sens în SQL'] },
      { term: 'ARRAY', answer: 'permite stocarea unui set de valori într-o singură coloană', distractors: ['permite doar text fără valori', 'nu este suportat de PostgreSQL', 'este folosit doar pentru CSS'] },
      { term: 'UPSERT', answer: 'inserează un rând sau îl actualizează dacă există deja', distractors: ['șterge în permanență datele', 'este un tip de query CSS', 'nu există în SQL'] },
      { term: 'ALTER TABLE', answer: 'modifică structura unui tabel existent', distractors: ['creează un nou browser', 'modifică fișierele CSS', 'nu poate modifica structura tabelului'] },
      { term: 'ENUM', answer: 'definește un set limitat de valori permise într-o coloană', distractors: ['permite orice text', 'este un alias JavaScript', 'nu este posibil în PostgreSQL'] },
      { term: 'tsvector', answer: 'stochează date text pentru căutare full-text', distractors: ['este un tip de cache', 'nu are legătură cu textul', 'se folosește doar în frontend'] },
      { term: 'pg_trgm', answer: 'extensie folosită pentru căutări fuzzy și similare', distractors: ['este un framework CSS', 'este o comandă JavaScript', 'nu există în PostgreSQL'] },
      { term: 'row-level lock', answer: 'blochează un rând în loc să blocheze întreg tabelul', distractors: ['blochează numai backend-ul', 'este un concept CSS', 'nu are legătură cu datele'] },
      { term: 'SERIAL', answer: 'generează automat valori numerice consecutive pentru o coloană', distractors: ['creează nume de culori', 'nu poate fi folosită în PostgreSQL', 'este o opțiune CSS'] },
      { term: 'trigger', answer: 'rulează automat o acțiune la fiecare eveniment definit pe tabel', distractors: ['este doar un efect JS', 'nu poate fi folosit în DB', 'este echivalent cu CSS'] },
      { term: 'materialized view', answer: 'stochează rezultatul pre-calculat al unei query pentru citiri rapide', distractors: ['este doar o interfață frontend', 'nu poate fi folosită în SQL', 'este un tip de browser'] },
      { term: 'window function', answer: 'permite calcule peste un set de rânduri legate de rândul curent', distractors: ['nu există în PostgreSQL', 'este un API de CSS', 'nu poate folosi valori'] },
    ],
  },
  {
    category: 'Node.js',
    facts: [
      { term: 'EventEmitter', answer: 'permite emiterea și ascultarea de evenimente într-un flux de lucru', distractors: ['este un tip de CSS', 'este o librărie HTML', 'nu există în Node.js'] },
      { term: 'stream', answer: 'permite procesarea datelor în flux, fără a încărca totul în memorie', distractors: ['oferă doar imagini statice', 'este un tip de middleware CSS', 'nu are utilitate'] },
      { term: 'cluster', answer: 'permite rularea mai multor procese Node.js pe mai multe nuclee CPU', distractors: ['este o metodă CSS', 'scrie doar date locale', 'nu poate fi folosit cu Node.js'] },
      { term: 'worker_threads', answer: 'permit executarea de sarcini CPU-intensive în thread-uri separate', distractors: ['sunt pentru stilizare', 'nu există în Node.js', 'se aplică doar la CSS'] },
      { term: 'child_process', answer: 'permite executarea de comenzi externe din aplicația Node.js', distractors: ['este un modul de CSS', 'nu poate rula comenzi shell', 'nu funcționează în server'] },
      { term: 'require()', answer: 'încarcă un modul sau fișier din aplicație', distractors: ['încarcă doar CSS-ul', 'elimină toate variabilele', 'este doar pentru browser'] },
      { term: 'module.exports', answer: 'expune API-ul unui modul pentru a fi utilizat în alte fișiere', distractors: ['este un element HTML', 'este doar pentru CSS', 'nu există în Node.js'] },
      { term: 'process.env', answer: 'conține variabilele de mediu ale aplicației', distractors: ['este un obiect CSS', 'nu există în runtime', 'este doar un obiect browser'] },
      { term: 'fs', answer: 'este modulul pentru accesarea sistemului de fișiere', distractors: ['este pentru styling', 'nu poate citi fișiere', 'este doar pentru browser'] },
      { term: 'path', answer: 'ajută la manipularea și construirea de căi de fișiere', distractors: ['este un tip de CSS', 'este doar pentru URL-uri', 'nu există în Node.js'] },
      { term: 'URL', answer: 'permite manipularea și parsarea adreselor URL', distractors: ['nu poate fi folosit în Node.js', 'este un element DOM', 'este un tip de layout'] },
      { term: 'Buffer', answer: 'stochează date brute în binar, utile pentru fișiere și rețea', distractors: ['este o metodă CSS', 'nu poate reprezenta date', 'este doar pentru HTML'] },
      { term: 'stream.pipeline()', answer: 'leagă fluxuri de date și gestionează erorile în mod sigur', distractors: ['testează CSS-ul', 'nu poate fi folosită în Node.js', 'împiedică toate stream-urile'] },
      { term: 'http', answer: 'este modulul pentru crearea serverelor HTTP', distractors: ['este un modul CSS', 'este doar pentru frontend', 'nu poate asculta porturi'] },
      { term: 'https', answer: 'este modulul pentru servere HTTP securizate cu TLS', distractors: ['este doar pentru browser', 'nu există în Node.js', 'este un tip de animație'] },
      { term: 'crypto', answer: 'oferă funcționalități criptografice pentru securitate', distractors: ['este un tip de layout CSS', 'nu are utilitate în backend', 'poate doar să rescrie HTML'] },
      { term: 'setImmediate()', answer: 'programează un callback după finalizarea evenimentelor curente', distractors: ['rulează înainte de orice cod', 'este doar pentru browser', 'nu poate fi folosit în Node.js'] },
      { term: 'process.nextTick()', answer: 'planifică o operațiune la următorul tick al event loop-ului', distractors: ['este un modul CSS', 'este un tip de query', 'nu există în Node.js'] },
      { term: 'os', answer: 'oferă informații despre sistemul de operare și resursele hardware', distractors: ['este doar pentru frontend', 'nu poate citi CPU-ul', 'este un obiect CSS'] },
      { term: 'zlib', answer: 'permite compresia și decompresia datelor', distractors: ['este un tip de layout', 'nu poate comprima fișiere', 'înlocuiește toate backend-urile'] },
      { term: 'perf_hooks', answer: 'oferă instrumente de măsurare a performanței aplicației', distractors: ['nu există în Node.js', 'este doar pentru frontend', 'rezolvă doar probleme CSS'] },
      { term: 'dotenv', answer: 'încarcă variabilele de mediu dintr-un fișier .env', distractors: ['setează tipurile CSS', 'nu are legătură cu mediul', 'se folosește doar în browser'] },
      { term: 'globalThis', answer: 'reprezintă obiectul global în orice context JavaScript', distractors: ['este doar pentru browser', 'nu poate fi folosit în Node.js', 'este un obiect CSS'] },
    ],
  },
  {
    category: 'Express',
    facts: [
      { term: 'app.use()', answer: 'înregistrează middleware-uri pentru toată aplicația sau pentru anumite rute', distractors: ['creează componente React', 'este doar pentru CSS', 'nu există în Express'] },
      { term: 'req, res, next', answer: 'sunt argumentele standard ale middleware-ului Express', distractors: ['sunt parametri CSS', 'nu există în Express', 'sunt doar pentru frontend'] },
      { term: 'middleware', answer: 'interceptează și procesează cererile înainte sau după rutare', distractors: ['este un tip de imagini', 'nu există în Express', 'este doar un plugin de frontend'] },
      { term: 'route parameters', answer: 'permit captarea valorilor din URL precum /users/:id', distractors: ['sunt doar variabile CSS', 'nu pot fi folosite în Express', 'sunt parametri de browser'] },
      { term: 'query parameters', answer: 'sunt informațiile din URL după ? precum ?page=2', distractors: ['sunt doar în formularul HTML', 'nu călătoresc în URL', 'sunt variabile de stil'] },
      { term: 'express.json()', answer: 'parsează body-ul JSON primit în cereri HTTP', distractors: ['parsează body-ul CSS', 'face doar redirect-uri', 'nu există în Express'] },
      { term: 'express.static()', answer: 'servește fișiere statice dintr-un director', distractors: ['creează doar componente React', 'nu poate servi imagini', 'este un middleware JavaScript'] },
      { term: 'res.send()', answer: 'trimite un răspuns simplu, text sau HTML', distractors: ['deschide numai stream-uri', 'este pentru frontend', 'nu trimite date'] },
      { term: 'res.json()', answer: 'trimite un răspuns în format JSON', distractors: ['trimite CSS-ul', 'nu există în Express', 'este doar pentru browser'] },
      { term: 'helmet', answer: 'adaugă header-uri de securitate pentru aplicațiile Express', distractors: ['este un tool de CSS', 'nu are rol în securitate', 'nu poate fi integrat'] },
      { term: 'cors', answer: 'permite cererile din alte origini în aplicațiile web', distractors: ['închide toate cererile', 'este doar frontend', 'nu are legătură cu rețeaua'] },
      { term: 'express.Router()', answer: 'creează un router modular pentru a organiza rutele aplicației', distractors: ['nu există în Express', 'activează CSS în browser', 'este un obiect DOM'] },
      { term: 'next(err)', answer: 'trimite erorile către middleware-ul de gestionare a erorilor', distractors: ['închide aplicația', 'nu există în Express', 'sunt doar parametri CSS'] },
      { term: 'error-handling middleware', answer: 'prinde și procesează erorile generate de rută sau middleware', distractors: ['nu există în Express', 'procesează doar CSS', 'este un tip de client'] },
      { term: 'status code', answer: 'indică rezultatul unei cereri HTTP, de exemplu 200, 404, 500', distractors: ['sunt doar date de browser', 'nu există în HTTP', 'sunt clase CSS'] },
      { term: 'app.locals', answer: 'stochează variabile locale partajate între rute și view-uri', distractors: ['sunt date de stocare browser', 'nu există în Express', 'este un obiect DOM'] },
      { term: 'cookie-parser', answer: 'parsează cookie-urile primite în cereri și le expune în req.cookies', distractors: ['este o librărie CSS', 'nu poate citi cookie-uri', 'nu există în Express'] },
      { term: 'REST API', answer: 'expune resurse prin URL-uri și verbe HTTP standardizate', distractors: ['este un tip de model CSS', 'nu are legătură cu serverul', 'este doar frontend'] },
      { term: 'JWT', answer: 'permite autentificarea prin token-uri semnate digital', distractors: ['este un tip de CSS', 'nu poate fi folosit în backend', 'nu există în Express'] },
    ],
  },
  {
    category: 'Tailwind',
    facts: [
      { term: 'className', answer: 'este atributul principal folosit pentru a aplica clase Tailwind în React', distractors: ['este un atribut CSS', 'nu există în React', 'se folosește numai pentru backend'] },
      { term: '@tailwind base', answer: 'importă stilurile de bază ale framework-ului Tailwind', distractors: ['activează doar React', 'nu există în Tailwind', 'este un modul Node.js'] },
      { term: 'bg-slate-500', answer: 'aplică un fundal de culoare din paleta slate', distractors: ['setează doar flex', 'este un CSS custom', 'nu există în Tailwind'] },
      { term: 'text-sm', answer: 'setează dimensiunea textului la un nivel specific', distractors: ['setează doar margini', 'nu există în Tailwind', 'este un atribut JavaScript'] },
      { term: 'rounded-xl', answer: 'aplică colțuri rotunjite mari pentru un element', distractors: ['creează linii de border', 'este un API JavaScript', 'nu există în CSS'] },
      { term: 'shadow-md', answer: 'adaugă o umbră moderată la componentă', distractors: ['creează animație', 'este un efect de backend', 'nu poate fi folosită'] },
      { term: 'flex', answer: 'transformă un element într-un container flexibil', distractors: ['este un atribut din React', 'este doar pentru backend', 'nu există în Tailwind'] },
      { term: 'grid', answer: 'activează layout-ul de tip grilă CSS', distractors: ['este un concept JavaScript', 'nu funcționează în browser', 'este un modul Node.js'] },
      { term: 'justify-center', answer: 'centrează elementele pe axa principală într-un flex sau grid', distractors: ['centrează doar textul', 'nu există în Tailwind', 'oprește layout-ul'] },
      { term: 'hover:bg-blue-500', answer: 'schimbă fundalul la hover', distractors: ['schimbă doar textul', 'nu poate folosi pseudo-clase', 'este un cod JavaScript'] },
      { term: 'focus:ring-2', answer: 'adaugă un inel de focus asupra unui element interactiv', distractors: ['dezactivează focus-ul', 'este doar pentru backend', 'înlocuiește HTML-ul'] },
      { term: 'dark:', answer: 'setează stiluri pentru tema dark în funcție de preferințele utilizatorului', distractors: ['setează doar fonturi', 'nu există în Tailwind', 'funcționează doar în server'] },
      { term: 'sm:', answer: 'aplică stiluri la breakpoint-ul small', distractors: ['nu există în Tailwind', 'este doar pentru Node.js', 'este un atribut HTML'] },
      { term: 'md:', answer: 'aplică stiluri la breakpoint-ul medium', distractors: ['este un pseudo-selector CSS', 'nu are legătură cu design-ul', 'nu există în Tailwind'] },
      { term: 'lg:', answer: 'aplică stiluri la breakpoint-ul large', distractors: ['este doar pentru backend', 'nu există în framework', 'schimbă doar background-ul'] },
      { term: 'arbitrary value', answer: 'permite valori personalizate cu sintaxa square bracket', distractors: ['sunt doar variabile JavaScript', 'nu există în CSS', 'nu pot primi valori'] },
      { term: 'ring', answer: 'adaugă un contur în jurul unui element, folosind box-shadow', distractors: ['mărește doar dimensiunea textului', 'nu există în Tailwind', 'este un obiect React'] },
      { term: 'ring-offset', answer: 'controlează distanța dintre ring și element', distractors: ['modifică doar culoarea fontului', 'este un API JavaScript', 'nu poate fi folosită'] },
      { term: 'backdrop-blur', answer: 'aplică efect de blur în spatele unui element transparent', distractors: ['este doar pentru imagini', 'oprește randarea CSS', 'nu există în Tailwind'] },
      { term: 'animate-pulse', answer: 'generează o animație subtilă de pulsare', distractors: ['este un tip de fetch', 'oprește toate animațiile', 'este doar pentru backend'] },
      { term: 'transition', answer: 'adaugă o tranziție între stări CSS', distractors: ['este un atribut HTML', 'nu există în Tailwind', 'este exclusiv JavaScript'] },
      { term: 'cursor-pointer', answer: 'schimbă cursorul într-un pointer de click', distractors: ['schimbă doar textul', 'nu există în framework', 'este un obiect de formă'] },
      { term: 'truncate', answer: 'restrânge textul pe o singură linie și adaugă elipsis', distractors: ['elimină toate textele', 'este un atribut React', 'nu poate fi folosit'] },
      { term: 'overflow-hidden', answer: 'ascunde conținutul care depășește dimensiunea containerului', distractors: ['schimbă CSS-ul din jur', 'nu există în Tailwind', 'este doar pentru imagini'] },
      { term: 'max-w-xl', answer: 'setează lățimea maximă la un nivel specific de layout', distractors: ['creează un background CSS', 'este exclusiv JavaScript', 'nu există în framework'] },
      { term: 'min-h-screen', answer: 'asigură că un element are înălțimea minimă a viewport-ului', distractors: ['este doar pentru imagini', 'activează scroll-ul infinit', 'nu există în Tailwind'] },
      { term: 'border', answer: 'adaugă o bordură simplă la un element', distractors: ['este sinonim cu margin', 'nu există în Tailwind', 'nu poate fi folosit'] },
      { term: 'divide-y', answer: 'adaugă linii de separare între elementele din interiorul unui container', distractors: ['este folosit în JS', 'nu există în Tailwind', 'creează mici animații'] },
      { term: 'tracking-wide', answer: 'mărește spațierea literelor în text', distractors: ['reduce dimensiunea textului', 'este un concept backend', 'nu este disponibil în Tailwind'] },
    ],
  },
]

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ---------------- întrebări din catalog (1 directă + 1 inversă per fapt) ----------------
const templates = [
  ({ category, fact }) => `Ce face ${fact.term} în ${category}?`,
  ({ category, fact }) => `Care afirmație este corectă despre ${fact.term} din ${category}?`,
  ({ category, fact }) => `Care este rolul lui ${fact.term} în ${category}?`,
  ({ category, fact }) => `Ce caracteristică are ${fact.term} în ${category}?`,
  ({ category, fact }) => `În contextul ${category}, ce este adevărat despre ${fact.term}?`,
  ({ category, fact }) => `Care variantă descrie corect ${fact.term} din ${category}?`,
]

const reverseTemplates = [
  ({ c, d }) => `Ce termen din ${c} corespunde descrierii: „${d}”?`,
  ({ c, d }) => `Despre ce concept din ${c} este vorba: „${d}”?`,
  ({ c, d }) => `Care termen din ${c} este definit astfel: „${d}”?`,
  ({ c, d }) => `Cărui termen din ${c} îi corespunde descrierea: „${d}”?`,
  ({ c, d }) => `Ce noțiune din ${c} este explicată prin: „${d}”?`,
]

function makeQuestion(category, text, correct, wrong) {
  const options = [correct, ...wrong]
  if (options.length !== 4 || new Set(options).size !== 4) return null
  return { category, text, choices: shuffle(options.map((t) => ({ text: t, isCorrect: t === correct }))) }
}

const fromCatalog = []
for (const { category, facts } of catalog) {
  for (const fact of facts) {
    const wrong = shuffle(fact.distractors.filter((x) => x !== fact.answer)).slice(0, 3)
    const direct = makeQuestion(category, shuffle(templates)[0]({ category, fact }), fact.answer, wrong)
    if (direct) fromCatalog.push(direct)

    const others = facts.filter((f) => f.term !== fact.term && f.answer !== fact.answer)
    const wrongTerms = shuffle(others).slice(0, 3).map((f) => f.term)
    const reverse = makeQuestion(category, shuffle(reverseTemplates)[0]({ c: category, d: fact.answer }), fact.term, wrongTerms)
    if (reverse) fromCatalog.push(reverse)
  }
}

// ---------------- unire + dedup + echilibrare pe categorii ----------------
const seen = new Set()
const byCategory = new Map()
for (const q of [...fromCatalog, ...generateAll()]) {
  if (seen.has(q.text)) continue
  seen.add(q.text)
  if (!byCategory.has(q.category)) byCategory.set(q.category, [])
  byCategory.get(q.category).push(q)
}

const queues = [...byCategory.values()].map(shuffle)
const picked = []
while (picked.length < targetCount && queues.some((q) => q.length)) {
  for (const queue of queues) {
    if (queue.length && picked.length < targetCount) picked.push(queue.pop())
  }
}
if (picked.length < targetCount) throw new Error(`Doar ${picked.length} întrebări unice disponibile.`)

const generated = shuffle(picked).map((q, i) => ({
  id: i + 1,
  category: q.category,
  difficulty: q.difficulty || difficulties[i % difficulties.length],
  text: q.text,
  choices: q.choices,
}))

fs.writeFileSync(`${__dirname}/questions.json`, `${JSON.stringify(generated, null, 2)}\n`)

const perCategory = generated.reduce((acc, q) => ({ ...acc, [q.category]: (acc[q.category] || 0) + 1 }), {})
console.log(`Generated ${generated.length} unique questions.`)
console.log(perCategory)