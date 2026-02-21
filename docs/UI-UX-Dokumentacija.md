# 4Sports - UI/UX Dokumentacija

## 1. Biranje jezika

### Opis ekrana
Na ekranu za unos pozivnog koda (prvi ekran aplikacije), na dnu se nalazi dugme za izbor jezika. Prikazuje zastavu i naziv trenutno izabranog jezika (npr. "🇷🇸 Srpski").

### Dostupni jezici
- **Srpski** (🇷🇸) - podrazumevani jezik
- **English** (🇬🇧)

### Kako korisnik koristi
1. Korisnik tapne na dugme za jezik na dnu ekrana
2. Otvara se padajuci meni sa dva jezika
3. Trenutno izabrani jezik je oznacen kvacicim i istaknut bojom
4. Korisnik tapne na zeljeni jezik
5. Interfejs se odmah menja na izabrani jezik
6. Meni se automatski zatvara

### Use case-ovi
- **Novi korisnik** otvara aplikaciju prvi put i zeli da je koristi na engleskom umesto podrazumevanog srpskog
- **Strani trener/roditelj** koji ne govori srpski prebacuje na engleski pre nego sto unese pozivni kod
- Izbor jezika se pamti trajno - pri sledecem otvaranju aplikacije jezik ostaje isti

---

## 2. Unos pozivnog koda

### Opis ekrana
Centralni ekran sa logom 4Sports na vrhu. Ispod loga je jedno polje za unos teksta gde korisnik ukucava pozivni kod koji je dobio od kluba/trenera.

### Elementi na ekranu
- **Logo 4Sports** - na vrhu, centriran
- **Polje za unos koda** - jedno tekstualno polje, tekst se automatski prikazuje velikim slovima
- **Dugme "Nastavi"** - zeleno dugme ispod polja za unos
- **Link "Vec imate nalog? Prijavite se"** - ispod dugmeta, za korisnike koji vec imaju nalog
- **Birac jezika** - na dnu ekrana

### Kako korisnik koristi
1. Korisnik dobija pozivni kod od trenera ili administratora kluba (npr. putem poruke, mejla, ili uzivo)
2. Ukucava kod u polje za unos
3. Tapne "Nastavi"
4. Aplikacija proverava kod:
   - **Kod validan** - korisnik se prebacuje na ekran za kreiranje naloga, gde su vec popunjeni podaci o klubu, grupi i ulozi
   - **Kod nevalidan** - prikazuje se poruka greske u crvenoj traci ispod polja

### Use case-ovi
- **Novi clan kluba**: Trener salje pozivni kod novom clanu koji se pridruzuje timu. Clan otvara aplikaciju, unosi kod i kreira nalog
- **Roditelj**: Klub generise kod za roditelja nekog clana. Roditelj unosi kod i dobija pristup sa ulogom "Roditelj"
- **Novi trener**: Vlasnik kluba generise kod za novog trenera sa ulogom "Trener"
- **Pogresan kod**: Korisnik pogresno ukuca kod, vidi poruku greske i moze odmah ponovo da pokusa

---

## 3. Kreiranje naloga i logovanje

### 3a. Kreiranje naloga (Registracija)

#### Opis ekrana
Na vrhu ekrana prikazuju se informacije o klubu: logo kluba, naziv kluba, naziv grupe i oznaka uloge (npr. "TRENER", "CLAN"). Ispod su polja za unos licnih podataka.

#### Elementi na ekranu
- **Logo kluba** - slika ili podrazumevana ikonica ako klub nema logo
- **Naziv kluba** - ispod loga, velikim slovima
- **Naziv grupe** - ispod naziva kluba, manjim slovima
- **Oznaka uloge** - obojena oznaka (npr. zelena za "TRENER", plava za "CLAN")
- **Formular za registraciju**:
  - Ime i prezime (obavezno, minimum 2 karaktera)
  - Email adresa (obavezno, mora biti validan format)
  - Broj telefona (obavezno, minimum 6 cifara)
  - Lozinka (obavezno, minimum 6 karaktera, sa ikonom oka za prikaz/sakrivanje)
  - Potvrda lozinke (mora se poklapati sa lozinkom)
- **Dugme "Registruj se"** - zeleno, na dnu formulara
- **Link "Vec imate nalog? Prijavite se"** - ispod dugmeta

#### Kako korisnik koristi
1. Korisnik vidi informacije o klubu kome se pridruzuje (potvrda da je ispravan kod)
2. Popunjava sva polja formulara
3. Greske se prikazuju u realnom vremenu ispod svakog polja (npr. "Lozinka mora imati najmanje 6 karaktera")
4. Tapne ikonu oka pored lozinke da vidi sta je ukucao
5. Tapne "Registruj se"
6. Ako je sve ispravno, nalog se kreira i korisnik se automatski uloguje i prebacuje na pocetni ekran

#### Use case-ovi
- **Tipicna registracija**: Clan unese pozivni kod, vidi da se pridruzuje klubu "FK Partizan" u grupu "Pioniri" sa ulogom "Clan", popuni podatke i kreira nalog
- **Greska u lozinki**: Korisnik ukuca razlicite lozinke u oba polja - prikazuje se poruka greske pre slanja

### 3b. Logovanje (Prijava)

#### Opis ekrana
Slican ekranu za pozivni kod - logo 4Sports na vrhu, ali sa dva polja za unos: email i lozinka.

#### Elementi na ekranu
- **Logo 4Sports** - na vrhu, centriran
- **Polje za email** - tekstualno polje sa formatom za email
- **Polje za lozinku** - sakriveni tekst sa ikonom oka za prikaz
- **Dugme "Prijavite se"** - zeleno dugme
- **Link "Nemate nalog? Registrujte se"** - vodi na ekran za pozivni kod

#### Kako korisnik koristi
1. Korisnik ukucava email adresu
2. Ukucava lozinku
3. Tapne "Prijavite se"
4. Ako su podaci tacni, korisnik se prebacuje na pocetni ekran u skladu sa svojom ulogom
5. Ako su podaci netacni, prikazuje se poruka greske

---

## 4. Pocetni ekran (Dashboard)

Pocetni ekran se razlikuje u zavisnosti od uloge korisnika.

### 4a. Pocetni ekran za trenera/vlasnika

#### Opis ekrana
Vertikalno skrolabilni ekran sa nekoliko sekcija koje pruzaju brz pregled najvaznijih informacija.

#### Sekcije

**Pozdrav (vrh ekrana)**
- Tekst "Dobrodosli" i ime korisnika velikim slovima

**Novosti**
- Prikazuje poslednju objavu iz kluba
- Kartica sa: avatarom autora, imenom autora, vremenom objave, naslovom i kratkim pregledom teksta
- Ako objava ima sliku, prikazuje se mala sličica
- Link "Otvori novosti" na dnu sekcije
- Ako nema objava, prikazuje se prazno stanje sa ikonom novina

**Danasnji dogadjaji (prikazuje se samo ako postoje)**
- Kartice za sve dogadjaje zakazane za danas

**Predstojecci dogadjaji**
- Lista predstojećih dogadjaja (treninzi, utakmice, sastanci...)
- Svaka kartica prikazuje:
  - Datum u obojenoj kutiji (dan + dan u nedelji)
  - Naziv dogadjaja
  - Vreme (od - do)
  - Naziv grupe
  - RSVP statistika: koliko dolazi (zeleno), ne dolazi (crveno), nije odgovorilo (zuto)
- Dugme "Pogledaj sve dogadjaje" na dnu
- Ako nema dogadjaja, prikazuje se prazno stanje sa dugmetom "Kreiraj dogadjaj"

#### Kako korisnik koristi
1. Otvara aplikaciju i odmah vidi pregled stanja kluba
2. Tapne na karticu novosti - odlazi na listu svih novosti
3. Tapne na karticu dogadjaja - odlazi na detalje tog dogadjaja
4. Tapne "Pogledaj sve" - odlazi na kalendar

### 4b. Pocetni ekran za clana

#### Opis ekrana
Slican trenerskom, ali sa istaknutom sekcijom za potvrdu prisustva.

#### Kljucna razlika - RSVP sekcija
Na vrhu ekrana (ispod pozdrava) istice se kartica za potvrdu prisustva na sledecem dogadjaju:
- Kartica sa okvirom u boji
- Informacije o sledecem dogadjaju (naziv, datum, vreme)
- **Dva dugmeta jedno pored drugog**:
  - **"Dolazim"** - zeleno dugme sa kvacicim
  - **"Ne dolazim"** - crveno dugme sa X

Ostale sekcije (novosti, predstojecci dogadjaji) su iste kao kod trenera.

#### Kako korisnik koristi
1. Otvara aplikaciju i odmah vidi sledeci dogadjaj i da li treba da potvrdi prisustvo
2. Tapne "Dolazim" ili "Ne dolazim" - potvrda se salje odmah
3. Dugme menja izgled (postaje popunjeno bojom) kao vizuelna potvrda izbora
4. Moze skrolovati dole da vidi novosti i ostale dogadjaje

#### Use case-ovi
- **Clan potvrduje dolazak**: Otvara aplikaciju ujutru, vidi da je trening u 18h, tapne "Dolazim"
- **Clan otkazuje**: Vec je potvrdio dolazak ali ne moze da dodje, tapne "Ne dolazim" da promeni status
- **Brz pregled**: Clan samo otvori aplikaciju da vidi kad je sledeci trening, bez tapkanja

---

## 5. Evidencija prisustva na treningu

Evidencija prisustva ima razlicite tokove za trenera i clana.

### 5a. Trener - Pokretanje evidencije (QR kod)

#### Opis ekrana
Ekran sa informacijama o dogadjaju na vrhu i QR kodom u centru.

#### Elementi na ekranu
- **Informacije o dogadjaju**: tip (npr. "TRENING"), naziv, datum i vreme
- **LIVE indikator**: zelena oznaka sa pulsirajucom tackom koja pokazuje da je sesija aktivna
- **Statistika prisustva**: tri broja u redu - Prisutni (zeleno), Cekaju (zuto), Procenat (plavo)
- **Prekidac za prikaz**: dva taba - "QR Kod" i "Lista prisustva"
- **QR kod**: veliki crno-beli QR kod (220x220px) na beloj pozadini
- **Uputstvo**: tekst koji objasnjava da clanovi treba da skeniraju kod
- **Dugme "Dodaj rucno"** - za rucno oznacavanje prisustva

#### Kako korisnik koristi
1. Trener otvara dogadjaj koji je u toku
2. Prikazuje QR kod na svom telefonu
3. Clanovi skeniraju kod svojim telefonima
4. Statistika se automatski azurira svakih 10 sekundi
5. Trener moze da prebaci na tab "Lista prisustva" da vidi ko je stigao, a ko ne

### 5b. Trener - Lista prisustva

#### Opis ekrana
Lista svih clanova grupe podeljena u dve sekcije.

#### Sekcije
- **Prisutni**: Zeleni status, prikazuje ime clana, avatar i vreme prijave
- **Cekaju**: Sivi status, prikazuje ime clana sa tekstom "Nije se prijavio"

#### Kako korisnik koristi
1. Trener prelazi na tab "Lista prisustva"
2. Vidi u realnom vremenu ko se prijavio i ko nije
3. Moze da povuce ekran nadole za rucno osvezavanje

### 5c. Trener - Rucno oznacavanje prisustva

#### Opis ekrana
Ekran sa listom svih clanova grupe sa poljima za oznacavanje (checkbox-ovi).

#### Elementi na ekranu
- **Kartica dogadjaja** na vrhu (naziv, datum, vreme)
- **Pretraga** - polje za pretragu clanova po imenu
- **Kontrole za selekciju**: brojac selektovanih, dugmici "Oznaci sve" i "Ponisti sve"
- **Lista clanova** - svaki clan prikazan kao kartica sa:
  - Polje za oznacavanje (checkbox) levo
  - Ime clana
  - Status (ako je vec oznacen)
  - Zeleni okvir oko kartice kada je clan oznacen
- **Dugmici na dnu**: "Otkazi" i "Sacuvaj prisustvo"

#### Kako korisnik koristi
1. Trener tapne "Dodaj rucno" sa QR ekrana
2. Vidi listu svih clanova grupe
3. Tapne na checkbox ili karticu svakog clana koji je prisutan
4. Moze koristiti "Oznaci sve" za brzo selektovanje
5. Moze pretraziti clana po imenu ako je lista velika
6. Tapne "Sacuvaj prisustvo" - svi selektovani se oznacavaju kao prisutni

#### Use case-ovi
- **QR ne radi nekom clanu**: Trener rucno oznaci tog clana
- **Brza evidencija**: Trener oznaci sve, pa ponisti samo one koji nisu dosli
- **Mali tim**: Lakse je rucno oznaciti 5-6 clanova nego da svaki skenira QR

### 5d. Clan - Skeniranje QR koda

#### Kako korisnik koristi
1. Clan otvara svoju 4Sports aplikaciju
2. Koristi skener u aplikaciji
3. Skenira QR kod sa trenerovog telefona
4. Aplikacija automatski potvrdjuje prisustvo
5. Clan dobija potvrdu da je prisustvo evidentirano

### 5e. Clan - Pregled istorije prisustva

#### Opis ekrana
Ekran sa ukupnom statistikom prisustva i listom prethodnih dogadjaja.

#### Elementi na ekranu
- **Kartica sa statistikom**:
  - Procenat prisustva (velikim brojem, obojen: zelen 80%+, zut 60-80%, crven ispod 60%)
  - Cetiri broja u redu: Prisutan, Kasni, Odsutan, Ukupno
- **Lista dogadjaja**: Hronoloski poredani dogadjaji sa:
  - Naziv dogadjaja
  - Datum
  - Nacin prijave i vreme (npr. "QR prijava: 10:30")
  - Statusna oznaka (zeleno "Prisutan", zuto "Kasni", crveno "Odsutan")

#### Kako korisnik koristi
1. Clan otvara sekciju za prisustvo
2. Na vrhu odmah vidi svoj ukupni procenat prisustva
3. Ispod vidi detaljnu statistiku (koliko puta bio prisutan, kasnio, odsustvovao)
4. Moze da skroluje kroz listu svih dogadjaja i vidi svoj status za svaki

#### Use case-ovi
- **Clan proverava evidenciju**: Zeli da vidi da li mu je trener oznacio prisustvo na proslom treningu
- **Roditelj prati prisustvo deteta**: Otvara aplikaciju da vidi koliko redovno dete ide na treninge
- **Motivacija**: Clan vidi da mu je procenat prisustva pao i odlucuje da bude redovniji

---

## 6. Kalendar sa aktivnostima

### Opis ekrana
Ekran sa mesecnim prikazom kalendara na vrhu i listom dogadjaja ispod. Datumi koji imaju zakazane aktivnosti oznaceni su obojenim tackicama.

### Elementi na ekranu
- **Mesecni kalendar** - mreza dana sa navigacijom levo/desno za prelazak na prethodni/sledeci mesec. Moze se i prevuci prstom levo/desno
- **Obojene tackice na datumima** - oznacavaju da postoji dogadjaj tog dana:
  - Plava tackica - trening
  - Narandzasta tackica - utakmica/takmicenje
  - Svetloplava tackica - ostalo
- **Filteri ispod kalendara**:
  - Dugme za izbor grupe (padajuci meni sa svim grupama + opcija "Sve grupe")
  - Tri filtera za tip: "Sve", "Treninzi", "Takmicenja"
- **Lista dogadjaja** ispod filtera

### Kartica dogadjaja
Svaka kartica prikazuje:
- **Datum** (levo) - obojena kutija sa brojem dana i skracenim imenom dana u nedelji
- **Naziv dogadjaja** sa vremenom (desno)
- **Naziv grupe** sa obojenom tackicom
- **Lokacija ili relativno vreme** (npr. "Danas", "Sutra", "Za 3 dana")

### Kako korisnik koristi
1. Otvara kalendar i vidi mesecni pregled sa oznacenim danima
2. Tapne na odredjeni datum - lista ispod prikazuje samo dogadjaje za taj dan
3. Tapne ponovo na isti datum da ponisti filter i vidi sve predstojecce dogadjaje
4. Koristi filtere za grupu ili tip dogadjaja za suzavanje prikaza
5. Tapne na karticu dogadjaja - odlazi na detalje tog dogadjaja
6. Povlaci ekran nadole za osvezavanje podataka

### Razlike izmedju uloga
- **Trener/Vlasnik**: Vidi sve dogadjaje kluba. Dogadjaji drugih trenera prikazani su bledji (manje vidljivi). Ima plutajuce dugme "+" u donjem desnom uglu za kreiranje novog dogadjaja
- **Clan**: Vidi samo dogadjaje svojih grupa. Nema dugme za kreiranje

### Use case-ovi
- **Trener planira nedelju**: Pregleda kalendar za tekucu nedelju, vidi raspored treninga i utakmica
- **Clan proverava raspored**: Otvara kalendar da vidi kad je sledeci trening ili utakmica
- **Filtriranje po grupi**: Trener koji vodi vise grupa bira jednu grupu da vidi samo njene dogadjaje
- **Pregled odredjenog dana**: Korisnik tapne na datum da vidi sta je zakazano za taj dan

---

## 7. Skeniranje QR koda za prisustvo

### Opis ekrana
Prikaz kamere u punom ekranu sa poluprozirnim tamnim slojem iznad i ispod zone za skeniranje. U centru ekrana je kvadratni okvir (250x250px) sa uglovima oznacenim u boji aplikacije - tu korisnik treba da pozicionira QR kod.

### Elementi na ekranu
- **Gornji deo** (zatamnjen):
  - Uputstvo: "Skenirajte QR kod dogadjaja za prijavu"
  - Oznaka korisnika: ikonica + ime i prezime clana
- **Centralni okvir za skeniranje**:
  - Proziran kvadrat sa cetiri obojene ugaone oznake
  - Kamera je aktivna i automatski detektuje QR kodove
- **Donji deo** (zatamnjen):
  - Uputstvo: "Usmerite kameru ka QR kodu koji prikazuje vas trener"
  - Dugme "Otkazi" za izlazak

### Specijalna stanja
- **Ucitavanje**: Spinner sa tekstom "Proveravam dozvolu kamere..."
- **Nema dozvole**: Ikona ugasene kamere, objasnjenje zasto je kamera potrebna, dugme "Dozvoli pristup kameri"
- **Tokom skeniranja**: Spinner sa tekstom "Prijavljivanje..."

### Kako korisnik koristi
1. Clan otvara skener iz navigacije aplikacije
2. Usmerava kameru telefona ka QR kodu na trenerovom telefonu
3. Kada kamera prepozna QR kod, telefon zavibrira
4. Aplikacija automatski salje zahtev za evidenciju prisustva
5. **Uspesno**: Pojavljuje se dijalog sa potvrdom i nazivom dogadjaja, korisnik tapne "Gotovo"
6. **Greska**: Pojavljuje se dijalog sa porukom greske (npr. "Prerano", "Dogadjaj zavrsen", "Nevalidan kod"), korisnik moze da tapne "Pokusaj ponovo" ili "Otkazi"

### Use case-ovi
- **Standardna prijava**: Clan dolazi na trening, trener prikazuje QR kod, clan skenira i prijavljuje prisustvo
- **Nema dozvole kamere**: Clan prvi put otvara skener, aplikacija trazi dozvolu za kameru
- **Prerano skeniranje**: Clan pokusa da skenira kod pre pocetka dogadjaja - dobija poruku greske
- **Visestruki clanovi**: Vise clanova redom skeniraju isti QR kod sa trenerovog telefona

---

## 8. Potvrda sopstvenog prisustva za sledeci trening (RSVP)

### Opis ekrana
Potvrda prisustva se pojavljuje na dva mesta: na pocetnom ekranu clana (dashboard) i na ekranu detalja dogadjaja.

### 8a. Na pocetnom ekranu (brza potvrda)

#### Elementi
- Istaknuta kartica sa okvirom u boji
- Informacije o sledecem dogadjaju: naziv, datum u obojenoj kutiji, tip dogadjaja, relativno vreme ("Za 2 dana") i tacno vreme
- Dva dugmeta jedno pored drugog:
  - **"Dolazim"** - zeleno sa kvacicim
  - **"Ne dolazim"** - crveno sa X

#### Kako korisnik koristi
1. Otvara aplikaciju i odmah vidi karticu za potvrdu
2. Tapne jedno od dva dugmeta
3. Dugme se odmah vizuelno promeni (postane popunjeno bojom) kao potvrda
4. Moze promeniti odluku tapkanjem na drugo dugme

### 8b. Na ekranu detalja dogadjaja (detaljna potvrda)

#### Elementi
- **Kartica RSVP statusa** na vrhu ekrana sa obojenom levom ivicom:
  - Zelena ivica + ikona kvacice = "Potvrdili ste prisustvo"
  - Crvena ivica + ikona X = "Otkazali ste prisustvo"
  - Narandzasta ivica + ikona upitnika = "Niste jos potvrdili prisustvo"
- Tekst ispod: "Mozete promeniti svoju odluku"
- Dva dugmeta: "Dolazim" i "Ne dolazim"
- Ako je dogadjaj prosao: sivi tekst "Ovaj dogadjaj je zavrsen" umesto dugmica

#### Dodatne informacije na ekranu
- Dva taba: "Pregled" i "Ucesnici"
- **Pregled tab**: datum, vreme, lokacija, grupa, opis, napomene, potrebna oprema, brza statistika (koliko dolazi/ne dolazi/ceka)
- **Ucesnici tab**: lista svih clanova sa njihovim RSVP statusom (zeleno potvrdjen, crveno otkazao, narandzasto nije odgovorio)

### Use case-ovi
- **Brza potvrda sa dashboarda**: Clan otvori aplikaciju, vidi sledeci trening, tapne "Dolazim" za 2 sekunde
- **Promena odluke**: Clan je potvrdio dolazak, ali mu se nesto desilo - otvori detalje dogadjaja i tapne "Ne dolazim"
- **Pregled ko dolazi**: Pre treninga, clan otvori tab "Ucesnici" da vidi ko je potvrdio dolazak
- **Prosli dogadjaj**: Clan otvori prosli dogadjaj i vidi samo informacije bez mogucnosti potvrde

---

## 9. Pregled clanova kluba

### Opis ekrana
Lista svih clanova kluba sa pretragom, filterima i kratkim statistikama.

### Elementi na ekranu
- **Pretraga** - veliko polje za pretragu na vrhu sa ikonom lupe. Kad korisnik pocne da kuca, pojavljuje se X za brisanje teksta
- **Filter cipovi** (ispod pretrage) - horizontalno skrolabilni:
  - "Svi (N)" - ukupan broj clanova
  - "Neplaceni (N)" - clanovi koji nisu platili clanarinu
  - "Medicinski problemi (N)" - clanovi kojima je istekao lekarski pregled
- **Kartice sa statistikama** - tri mini kartice u redu:
  - Ukupno clanova (plav broj)
  - Neplacenih (narandzast broj)
  - Medicinski problemi (crven broj)
- **Lista clanova** - svaki clan prikazan kao kartica sa:
  - Avatar (inicijali ili slika)
  - Ime i prezime (podebljano)
  - Status placanja (zelena kvacica ili narandzasto upozorenje)
  - Status lekarskog pregleda (zeleno ili crveno)
- **Plutajuce dugme "+"** - u donjem desnom uglu za dodavanje novih clanova

### Kako korisnik koristi
1. Otvara listu clanova i vidi sve clanove sa njihovim statusima
2. Kuca ime u pretragu da brzo nadje odredjenog clana
3. Tapne na filter "Neplaceni" da vidi samo clanove koji duguju
4. Tapne na karticu clana - odlazi na profil clana sa detaljima
5. Tapne "+" da pozove novog clana u klub

### Prazno stanje
- Ako nema clanova: ikona grupe + tekst "Nema clanova"
- Ako pretraga ne vrati rezultate: ikona grupe + tekst "Nema rezultata"

### Use case-ovi
- **Provera placanja**: Trener tapne filter "Neplaceni" da vidi ko nije platio clanarinu ovog meseca
- **Brza pretraga**: Trener trazi konkretnog clana po imenu
- **Pregled zdravstvenog stanja**: Trener proverava kojima je clanovima istekao lekarski pregled
- **Dodavanje clana**: Trener tapne "+" da generise pozivni kod za novog clana

---

## 10. Profil clana sa podacima

### Opis ekrana
Detaljan prikaz informacija o jednom clanu. Ekran ima zaglavlje sa osnovnim podacima i tri taba za razlicite kategorije informacija.

### Zaglavlje (uvek vidljivo)
- **Avatar** (64x64px) - slika clana ili inicijali u krugu
- **Ime i prezime** - podebljano, velikim slovima
- **Naziv grupe** - ispod imena, u boji aplikacije
- **Poslednja aktivnost** - ikona sata + datum
- **Statusne oznake**:
  - Status placanja (zeleno "Placeno" ili narandzasto "Nije placeno")
  - Status lekarskog pregleda (zeleno "Vazeci" ili crveno "Istekao")
- **Dugme za podsecanje** - ikona zvona, pojavljuje se ako clan nije platio ili mu je istekao pregled. Tapkom salje podsetnik
- **Dugme za poruku** - zeleno plutajuce dugme u donjem desnom uglu za slanje poruke clanu

### Tab 1: Profil (licni podaci)
Kartica sa informacijama u redovima, svaki red ima ikonu, naziv i vrednost:
- Datum rodjenja
- Starost (u godinama)
- Pozicija (npr. "Napadac")
- Broj dresa
- Visina (cm)
- Tezina (kg)
- Datum isteka lekarskog pregleda (zeleno ako je vazeci, crveno ako je istekao)
- Datum pridruzivanja klubu
- Telefon roditelja (tapkom se otvara poziv)
- Ime roditelja
- Email roditelja (tapkom se otvara email)
- **Dugme za uredjivanje** - ikona olovke u gornjem desnom uglu kartice

### Tab 2: Clanarina (finansije)
- **Kartica sa pregledom**:
  - Mesecna clanarina (iznos u RSD)
  - Broj meseci placanja
  - Dug (zeleno ako je nula, crveno ako postoji dug)
- **Naslov "Istorija placanja"**
- **Mesecne kartice** - za svaki mesec prikazuje:
  - Mesec i godina
  - Uplaceni iznos / ocekivani iznos (npr. "3000 / 3000 RSD")
  - Statusna oznaka:
    - Zeleno "PLACENO" - za potpuno placene mesece
    - Narandzasto "DELIMICNO" - za parcijalna placanja
    - Crveno "NIJE PLACENO" - za neplacene mesece
- **Dugme "Evidentiraj uplatu"** - na dnu, zeleno, za unos novog placanja
- Prazno stanje: ikona + tekst "Nema uplata" ako nema istorije

### Tab 3: Prisustvo (evidencija)
- **Kartica sa statistikom**:
  - Veliki kruzni indikator procenta prisustva (80x80px)
  - Tri reda statistike sa obojenim tackicama:
    - Zelena: Prisutan + broj
    - Narandzasta: Kasni + broj
    - Crvena: Odsutan + broj
- **Naslov "Evidencija prisustva"**
- **Kartice za poslednjih 10 dogadjaja** - svaka prikazuje:
  - Obojen indikator (zeleno/narandzasto/crveno)
  - Tip dogadjaja i datum
  - Statusna oznaka
  - Strelica desno (tapkom se otvara dogadjaj)
- Prazno stanje: ikona kalendara + tekst "Nema evidencije"

### Razlike izmedju uloga
- **Trener/Vlasnik vidi profil clana**: Puni prikaz sa sva tri taba, moze uredjivati podatke, evidentirati uplate, slati podsetnice
- **Clan vidi profil drugog clana**: Pojednostavljen prikaz sa samo osnovnim informacijama (avatar, ime, grupa, broj dresa, pozicija, starost). Nema pristup finansijama niti detaljnom prisustvu

### Use case-ovi
- **Trener proverava podatke**: Otvara profil clana pre utakmice da proveri broj dresa i poziciju
- **Evidencija uplate**: Clan plati clanarinu, trener otvara profil, ide na tab "Clanarina" i tapne "Evidentiraj uplatu"
- **Pregled prisustva clana**: Trener otvara tab "Prisustvo" da vidi koliko redovno clan dolazi na treninge
- **Slanje podsetnika**: Trener vidi da clan nije platio, tapne dugme zvona da posalje podsetnik
- **Kontakt roditelja**: Trener tapne na telefon roditelja da ga pozove direktno iz aplikacije
- **Azuriranje podataka**: Trener tapne ikonu olovke da izmeni podatke clana (visina, tezina, pozicija...)

---

## 11. Finansije - Evidencija uplate (mobilna aplikacija)

### Opis ekrana
Formular za evidentiranje uplate clana. Trener bira clana, mesec, unosi iznos i nacin placanja.

### Elementi na ekranu

**Izbor clana i meseca (vrh)**
- Ime clana sa ikonom levo
- Dugme za izbor meseca desno (prikazuje "Mesec Godina" u plavoj boji)

**Birac meseca (prosiriv)**
- Skrolabilna lista meseci (do 12 meseci unazad od trenutnog)
- Prikazuju se samo meseci nakon sto se clan pridruzio klubu
- Svaki red prikazuje:
  - Naziv meseca (izabrani istaknut bojom)
  - Statusna oznaka desno:
    - Zelena "Placeno" sa kvacicim - potpuno placen mesec
    - Zuta sa iznosom "uplaceno/ocekivano" i ostatkom u crvenom - delimicno placen
    - Crvena "Nije placeno" - neplacen mesec

**Izbor clana (ako nije vec izabran)**
- Naslov: "Izaberite clana"
- Horizontalna lista dugmica sa imenima clanova
- Aktivno dugme: popunjeno bojom sa belim tekstom
- Neaktivno: samo okvir
- Ako nema clanova: kartica sa ikonom i tekstom "Nema dostupnih clanova"

**Polje za iznos**
- Naslov: "Iznos"
- Numericko polje za unos sa oznakom "RSD" desno
- Placeholder: "Unesite iznos"

**Nacin placanja**
- Naslov: "Nacin placanja"
- Dva dugmeta jedno pored drugog:
  - **Gotovina** - ikona novca + tekst
  - **Bankarski transfer** - ikona banke + tekst
- Aktivno: zelena pozadina sa belim tekstom
- Neaktivno: svetla pozadina sa sivim tekstom

**Napomena (opciono)**
- Naslov: "Napomena (opciono)"
- Viselinijsko tekstualno polje
- Placeholder: "npr. Mesecna clanarina za januar"

**Dugmici na dnu**
- **"Evidentiraj uplatu"** - zeleno dugme sa kvacicim (onemoguceno dok se ne izabere clan)
- **"Otkazi"** - dugme sa okvirom

### Kako korisnik koristi
1. Trener otvara ekran za evidenciju uplate (iz profila clana ili liste clanova)
2. Ako clan nije vec izabran, bira ga iz horizontalne liste
3. Bira mesec za koji se placa - vidi odmah status svakog meseca
4. Unosi iznos uplate u RSD
5. Bira nacin placanja (gotovina ili transfer)
6. Opciono dodaje napomenu
7. Tapne "Evidentiraj uplatu"

### Logika iznosa
- Ocekivani mesecni iznos se odredjuje po hijerarhiji:
  - Ako clan ima individualni iznos clanarine → koristi se taj
  - Ako ne, koristi se iznos grupe
  - Ako ni grupa nema → podrazumevani iznos (3000 RSD)

### Use case-ovi
- **Mesecna uplata**: Clan plati clanarinu za januar, trener otvara formular, bira januar, unosi 3000 RSD, bira gotovinu
- **Delimicna uplata**: Clan nema ceo iznos, plati 2000 od 3000 - trener unosi 2000, mesec se oznacava kao "Delimicno placen"
- **Vise meseci**: Clan nije platio 3 meseca, trener evidentira svaki mesec posebno
- **Pregled statusa**: Pre unosa trener vidi u biracu meseci koji su meseci vec placeni, a koji ne

---

## 12. Finansije - Pregled uplata (clan)

### Opis ekrana
Ekran na kome clan vidi svoje finansijske obaveze i istoriju placanja.

### Elementi na ekranu

**Kartica sa pregledom (vrh)**
- Naslov: "Pregled uplata" (centriran)
- Tri kolone sa vertikalnim razdvajacima:
  - **Placeno** - veliki zeleni iznos
  - **Na cekanju** - veliki zuti iznos
  - **Kasni** - veliki crveni iznos

**Filter dugmici**
- Cetiri dugmeta u redu: "Sve", "Placeno", "Na cekanju", "Kasni"
- Aktivno dugme istaknut bojom
- Filtrira listu ispod

**Lista uplata**
- Svaka uplata prikazana kao kartica sa:
  - **Zaglavlje**: Tip uplate (npr. "Clanarina") | Statusna oznaka (obojena)
  - **Detalji** (ikona + tekst po redu):
    - Ikona novca + iznos u RSD
    - Ikona kalendara + "Period: Mesec Godina"
    - Ikona sata + "Rok: Datum"
    - Ikona kvacice + "Placeno: Datum" (samo ako je placeno)
- Prazno stanje: ikona + "Nema uplata"

### Kako korisnik koristi
1. Clan otvara sekciju za uplate
2. Na vrhu odmah vidi ukupne iznose: koliko je platio, koliko je na cekanju, koliko kasni
3. Moze filtrirati po statusu (npr. "Kasni" da vidi dugovanja)
4. Skroluje kroz listu svih uplata sa detaljima
5. Povlaci ekran nadole za osvezavanje

### Use case-ovi
- **Provera stanja**: Clan proverava da li mu je trener evidentirao poslednju uplatu
- **Pregled dugovanja**: Clan filtrira "Kasni" da vidi koliko meseci duguje
- **Roditelj prati placanje**: Roditelj otvara istu sekciju da vidi placanja za svoje dete (vidi svu decu zajedno)

---

## 13. Finansije - Pregled finansija (web admin panel)

### Opis ekrana
Sveobuhvatan ekran za upravljanje finansijama kluba u web admin panelu. Prikazuje prihode, rashode, transakcije sa naprednim filtriranjem i grupisanjem.

### Elementi na ekranu

**Zaglavlje**
- Naslov: "Finansije"
- Podnaslov
- Zeleno dugme "Dodaj stavku" sa ikonom +

**Kartice sa pregledom (tri kolone)**
- **Ukupan prihod**: Ikona rastuceg trenda (zelena) + veliki zeleni iznos u RSD + opis "Sav prihod ovog meseca"
- **Ukupan rashod**: Ikona padajuceg trenda (crvena) + veliki crveni iznos u RSD + opis "Tekuci mesec"
- **Neto dobit/gubitak**: Ikona dolara + veliki iznos (zelen ako je dobit, crven ako je gubitak) + opis "Dobit" ili "Gubitak"

**Panel filtera (rasklopliv)**
- **Zaglavlje panela**:
  - Levo: Ikona filtera + "Filteri" + oznaka sa brojem aktivnih filtera
  - Centar: Statistika ("Prikazuje se X transakcija", "Prihod: X RSD", "Rashod: X RSD", "Neto: X RSD")
  - Desno: Dugme "Ponisti sve filtere" (ako su filteri aktivni) + strelica za sklapanje
- **Mreza filtera** (kada je rasklopljen, 4 kolone):
  - **Tip transakcije**: Padajuci meni (Sve, Prihod, Rashod)
  - **Kategorija**: Meni sa checkboxima za kategorije
  - **Grupe**: Meni sa checkboxima + obojene tackice uz nazive grupa
  - **Treneri**: Meni sa checkboxima

**Kontrole grupisanja**
- Levo: Padajuci meni "Grupisanje" (Bez grupisanja, Po mesecu, Po grupi, Po kategoriji)
- Desno: Birac datumskog opsega

**Prikaz transakcija**

Ako je grupisanje iskljuceno - prikazuje se tabela sa kolonama:
- Datum
- Tip (zelena/crvena oznaka: PRIHOD/RASHOD)
- Kategorija
- Opis
- Grupa (obojena tackica + naziv, ili "—")
- Iznos (zeleno za prihod, crveno za rashod)
- Uneo (ime korisnika ili "Vi")
- Akcije (ikone za uredjivanje i brisanje, samo za rucne stavke)

Ako je grupisanje ukljuceno - prikazuju se raskloplive grupne kartice:
- Zaglavlje grupe sa: strelica + naziv + broj transakcija + prihod (zeleno) + rashod (crveno) + neto
- Kada se raskopi: tabela transakcija unutar te grupe

**Sumarni red (dno)**
- "Ukupno: X transakcija" + "Prihod: X RSD" (zeleno) + "Rashod: X RSD" (crveno) + "Neto: X RSD"

### Dijalog za dodavanje stavke
Polja formulara:
- **Tip** (obavezno): Padajuci meni - PRIHOD ili RASHOD
- **Kategorija** (obavezno): Zavisno od tipa:
  - Prihod: Clanarina, Kotizacija, Sponzorstvo, Prodaja opreme, Ostalo
  - Rashod: Nabavka opreme, Zakup prostora, Plata trenera, Komunalije, Ostalo
- **Grupa** (opciono): Padajuci meni sa grupama ili "Bez grupe"
- **Iznos** (obavezno): Numericko polje u RSD
- **Opis** (obavezno): Tekstualno polje
- **Datum** (obavezno): Birac datuma, podrazumevano danas
- Dugmici: "Otkazi" i "Dodaj" (zeleno)

### Kako korisnik koristi
1. Otvara stranicu finansija i odmah vidi tri kartice sa pregledom (prihod, rashod, neto)
2. Pregleda tabelu transakcija sa svim unosima
3. Koristi filtere za suzavanje prikaza (npr. samo prihodi, samo odredjena grupa)
4. Grupise transakcije po mesecu da vidi mesecni pregled
5. Bira datumski opseg za analizu odredjenog perioda
6. Tapne "Dodaj stavku" da rucno unese prihod ili rashod
7. Tapne ikonu olovke na postojecoj stavci da je izmeni
8. Tapne ikonu kante da obrise stavku

### Use case-ovi
- **Mesecni pregled**: Vlasnik kluba otvara finansije da vidi koliki je prihod i rashod za tekuci mesec
- **Analiza po grupi**: Vlasnik grupise po grupama da vidi koja grupa generise najvise prihoda
- **Evidencija troskova**: Vlasnik unosi troskove zakupa terena ili plate trenera
- **Pracenje naplate**: Vlasnik filtrira po kategoriji "Clanarina" da vidi sve uplate clanova
- **Godisnji pregled**: Vlasnik menja datumski opseg da vidi finansijsko stanje za celu godinu

---

## 14. Podesavanje clanarine

### Opis
Clanarina se moze podesiti na dva nivoa: na nivou grupe i na nivou pojedinacnog clana.

### 14a. Clanarina na nivou grupe

#### Gde se podesava
- **Mobilna aplikacija**: Prilikom kreiranja ili uredjivanja grupe
- **Web admin panel**: U dijalogu za kreiranje/uredjivanje grupe

#### Elementi
- Polje "Mesecna clanarina (RSD)" - numericko polje
- Opciono - ako se ne popuni, koristi se podrazumevani iznos (3000 RSD)
- Ova vrednost vazi za sve clanove grupe kao podrazumevana

### 14b. Clanarina na nivou clana (individualna)

#### Gde se podesava
- **Mobilna aplikacija**: U uredjivanju profila clana
- **Web admin panel**: U dijalogu za uredjivanje clana

#### Elementi
- Polje "Mesecna clanarina (RSD)" - numericko polje
- Opciono - ako se popuni, zamenjuje iznos grupe za tog clana

### Hijerarhija iznosa
1. Ako clan ima individualnu clanarinu → koristi se ta
2. Ako ne, koristi se clanarina grupe
3. Ako ni grupa nema → podrazumevani iznos (3000 RSD)

### Use case-ovi
- **Standardna clanarina**: Vlasnik podesava 5000 RSD za grupu "Seniori" - svi clanovi te grupe imaju mesecnu obavezu od 5000 RSD
- **Popust za clana**: Jedan clan ima finansijskih poteskoca, trener mu podesava individualnu clanarinu od 3000 umesto grupnih 5000 RSD
- **Vise dece u klubu**: Roditelj ima dvoje dece u klubu, drugom detetu se stavlja niza clanarina kao porodicni popust
- **Besplatno clanstvo**: Clan koji je na stipendiji dobija individualnu clanarinu od 0 RSD
