const fs = require('fs');
const readline = require('readline');
 
// Ayarlar ve takım bilgilerini yükleme
const ayarlar = JSON.parse(fs.readFileSync('./data/ayarlar.json', 'utf-8'));
const takimlar = JSON.parse(fs.readFileSync('./data/takimlar.json', 'utf-8'));
 
// Takım bilgilerini başlangıç değerleriyle oluşturma
const puanDurumu = [];
takimlar.forEach(takim => {
    puanDurumu.push({
        takimKisaAdi: takim.takimKisaAdi,
        takimAdi: takim.takimAdi,
        oynananMac: 0,
        galibiyet: 0,
        beraberlik: 0,
        maglubiyet: 0,
        attigiGol: 0,
        yedigiGol: 0,
        averaj: 0,
        puan: 0
   
    });
});
 
// Maçları takip etmek için
const oynananMaclar = new Set();
 
// Maç giriş hatalarını belirleme
 function macIsle(evSahibi, evSahibiGol, misafir, misafirGol) {
 
    //geçersiz formatta yazım durumu
    if (!evSahibi || isNaN(evSahibiGol) || !misafir || isNaN(misafirGol)) {
        console.error('Geçersiz giriş. Doğru format: "EV_SAHIBI GOL MISAFIR GOL"');
        return;
    }
 
    const evTakim = puanDurumu.find(t => t.takimKisaAdi === evSahibi.toUpperCase());
    const misafirTakim = puanDurumu.find(t => t.takimKisaAdi === misafir.toUpperCase());
   
    // gol sayılarının negatif olma durumu
    if (evSahibiGol < 0 || misafirGol < 0) {
        console.error('Gol sayıları negatif olamaz. Lütfen geçerli bir değer girin.');
        return;
    }
 
    //sayı dışında karakter girdi durumu
    if (isNaN(evSahibiGol) || isNaN(misafirGol)) {
        console.error('Geçersiz skor değeri girildi.');
        return;
    }
 
    //ondalıklı sayı girdi durumu
    if (!Number.isInteger(evSahibiGol) || !Number.isInteger(misafirGol)) {
        console.error('Gol sayıları tam sayı olmalıdır. Lütfen geçerli bir değer girin.');
        return;
    }
 
    //misafir takım ile ev sahibi takımın aynı olma durumu
    if (evTakim === misafirTakim) {
        console.error('Ev sahibi ve misafir takımı aynı olamaz.');
        return; // Fonksiyonu burada sonlandır
    }
 
    //takım varlığını kontrol etme durumu
    if (!evTakim || !misafirTakim) {
        console.error('Hatalı takım ismi girildi.');
        return;
    }
   
    //tekrarlanan maç kontrolü
    if (oynananMaclar.has(`${evSahibi}-${misafir}`)) {
        console.log('Bu maç daha önce oynandı. İşlenmedi.');
        return;
    }
 
    oynananMaclar.add(`${evSahibi}-${misafir}`);
 
    // Maç istatistiklerini güncelle
   
    evTakim.oynananMac++;
    misafirTakim.oynananMac++;
    evTakim.attigiGol += evSahibiGol;
    evTakim.yedigiGol += misafirGol;
    misafirTakim.attigiGol += misafirGol;
    misafirTakim.yedigiGol += evSahibiGol;
 
    if (evSahibiGol > misafirGol) {
        evTakim.galibiyet++;
        evTakim.puan += ayarlar.galibiyetPuan;
        misafirTakim.maglubiyet++;
        misafirTakim.puan += ayarlar.maglubiyetPuan;
    } else if (evSahibiGol < misafirGol) {
        misafirTakim.galibiyet++;
        misafirTakim.puan += ayarlar.galibiyetPuan;
        evTakim.maglubiyet++;
        evTakim.puan += ayarlar.maglubiyetPuan;
    } else {
        evTakim.beraberlik++;
        misafirTakim.beraberlik++;
        evTakim.puan += ayarlar.beraberlikPuan;
        misafirTakim.puan += ayarlar.beraberlikPuan;
    }
 
      }
 
 
    // Averajı güncelle
    function averajlariGuncelle(evTakim, misafirTakim) {
        evTakim.averaj = evTakim.attigiGol - evTakim.yedigiGol;
        misafirTakim.averaj = misafirTakim.attigiGol - misafirTakim.yedigiGol;
    }
 
    // Dosyadan maç girişi
 function dosyadanMacGirisi(dosyaAdi) {
    const maclar = fs.readFileSync(dosyaAdi, 'utf-8').trim().split('\n');
    maclar.forEach(mac => {
        const [evSahibi, evGol, misafir, misafirGol] = mac.split(' ');
        macIsle(evSahibi, parseInt(evGol), misafir, parseInt(misafirGol));
    });
    puanDurumuYazdir();
}
 
  // Puan durumu yazdırma
 function puanDurumuYazdir() {
    console.log('\nPuan Durumu:');
    console.table(puanDurumu);
}
 
  // Programın başlangıç noktası
async function main() {
    console.log('Lig Fikstürü Yönetim Sistemi');
    console.log('Klavyeden maç girişi yapmak için maç bilgisi girin. Çıkmak için "exit" yazın.');
    console.log('Dosyadan maç girişi yapmak için "dosya <dosya adı>" komutunu kullanın.');
 
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
 
    for await (const line of rl) {
        if (line.toLowerCase() === 'exit') {
            console.log("Maç bitti!")
            rl.close();
            break;
        }
 
        if (line.startsWith('dosya ')) {
            const dosyaAdi = line.split(' ')[1];
            dosyadanMacGirisi(dosyaAdi);
        } else {
            const [evSahibi, evGol, misafir, misafirGol] = line.split(' ');
            macIsle(evSahibi, parseInt(evGol), misafir, parseInt(misafirGol));
            puanDurumuYazdir();
        }
    }
}
 
 
main();