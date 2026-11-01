/**
 * Turkish legal and support texts for /privacy, /terms and /help.
 * Translated from the English texts in legal-en.ts and the English UI strings of the pages.
 */
import type { LegalPack } from "./legal-pack";

export const LEGAL_TR: LegalPack = {
  effectiveDate: "1 Eylül 2026",
  effectiveLine: (date, brand) => `Yürürlük tarihi: ${date} · ${brand}`,
  home: "Ana Sayfa",

  privacyTitle: "Gizlilik Politikası",
  privacyMetaTitle: "Gizlilik Politikası | Webyar",
  privacyMetaDescription:
    "Webyar'ın kişisel verileri nasıl topladığı, kullandığı, sakladığı, koruduğu ve sildiği ile gizlilik haklarınızı nasıl kullanabileceğiniz.",
  privacySections: (brand, email, address) => [
    {
      title: "1. Giriş",
      body: [
        `Bu Gizlilik Politikası, web sitemizi, mobil uygulamalarımızı ve ilgili hizmetlerimizi (birlikte "Hizmetler") kullandığınızda ${brand} ("biz", "bize", "bizim") tarafından kişisel bilgilerin nasıl toplandığını, kullanıldığını, açıklandığını, saklandığını ve korunduğunu açıklar.`,
        `Hizmetleri kullanarak bu Politikayı kabul etmiş olursunuz. Kabul etmiyorsanız lütfen Hizmetleri kullanmayı bırakın.`,
      ],
    },
    {
      title: "2. Topladığımız Bilgiler",
      body: [
        "Hesap verileri: ad, e-posta adresi, telefon numarası (paylaşmanız hâlinde) ve oturum açmanız için kullanılan parola özeti (hash).",
        "İçerik verileri: sizin veya son kullanıcılarınızın Hizmetlere gönderdiği mesajlar, destek talepleri, dosyalar, kişiler ve diğer içerikler.",
        "Kullanım verileri: görüntülenen sayfalar, kullanılan özellikler, IP adresinden türetilen yaklaşık konum, cihaz türü, işletim sistemi, tarayıcı ve çökme raporları.",
        "İşlem verileri: abonelik planı, faturalandırma durumu ve fatura kayıtları. Ödeme kartı numaralarının tamamı hiçbir zaman tarafımızca saklanmaz; bunlar ödeme hizmeti sağlayıcılarımız tarafından işlenir.",
      ],
    },
    {
      title: "3. Bilgileri Nasıl Kullanıyoruz",
      body: [
        "Hesabınızı oluşturmak, sürdürmek ve kimliğinizi doğrulamak için.",
        "Hizmetleri sunmak, işletmek, desteklemek, güvence altına almak ve geliştirmek için.",
        "Hizmet güncellemeleri, güvenlik bildirimleri ve destek talepleri hakkında sizinle iletişim kurmak için.",
        "Dolandırıcılığı, kötüye kullanımı ve Kullanım Koşullarımızın ihlallerini tespit etmek, önlemek ve incelemek için.",
        "Yasal yükümlülüklere uymak için.",
      ],
    },
    {
      title: "4. Hukuki Dayanaklar",
      body: [
        "Kanunen gerekli olduğu durumlarda kişisel verileri; sözleşmenin ifası (talep ettiğiniz Hizmetlerin sunulması), meşru menfaatler (güvenlik, ürün geliştirme), açık rıza (isteğe bağlı iletişimler) ve yasal yükümlülükler dayanağıyla işleriz.",
      ],
    },
    {
      title: "5. Paylaşım ve Açıklama",
      body: [
        "Kişisel bilgilerinizi satmayız ve üçüncü tarafların kendi reklamları için onlarla paylaşmayız.",
        "Verileri yalnızca sözleşmeye dayalı gizlilik yükümlülükleri altında bizim adımıza hareket eden hizmet sağlayıcılarla (barındırma, depolama, e-posta gönderimi, analiz, ödeme işleme) ve yürürlükteki mevzuat veya geçerli bir hukuki süreç gerektirdiğinde paylaşırız.",
      ],
    },
    {
      title: "6. Çocukların Gizliliği",
      body: [
        "Hizmetler 13 yaşından küçük çocuklara yönelik değildir ve onlardan bilerek kişisel bilgi toplamayız. Bir çocuğun bize kişisel veri sağladığını düşünüyorsanız bizimle iletişime geçin; bu verileri sileriz.",
      ],
    },
    {
      title: "7. Veri Güvenliği",
      body: [
        "Verilerinizi korumak için aktarım sırasında şifreleme (TLS), parola özetleme (hashing), erişim kontrolleri, denetim kayıtları ve düzenli yedeklemeler kullanırız. Hiçbir aktarım veya depolama yöntemi tamamen güvenli değildir; ancak bilgilerinizi korumak için çalışır ve kanunen gerekli olduğu durumlarda bir veri ihlalini size bildiririz.",
      ],
    },
    {
      title: "8. Verilerin Saklanması",
      body: [
        "Kişisel verileri hesabınız aktif olduğu sürece ve Hizmetleri sunmak için gerektiği müddetçe saklarız. Hesap silindikten sonra, yasal, muhasebesel veya güvenlik nedenleriyle daha uzun saklama gerekmedikçe kişisel verileri 30 gün içinde siler ya da anonim hâle getiririz.",
      ],
    },
    {
      title: "9. Haklarınız ve Hesabın Silinmesi",
      body: [
        "Kişisel verilerinize erişim, bunların düzeltilmesi, dışa aktarılması veya silinmesi talebinde dilediğiniz zaman bulunabilirsiniz. Ayrıca belirli işlemelere itiraz edebilir veya bunların kısıtlanmasını isteyebilir, işlemenin rızaya dayandığı durumlarda rızanızı geri çekebilirsiniz.",
        `Hesabınızı ve ilişkili tüm kişisel verilerinizi silmek için hesabınıza bağlı adresten ${email} adresine "Hesap Silme Talebi" konulu bir e-posta gönderin. Doğrulanmış talepleri 30 gün içinde onaylar ve tamamlarız.`,
      ],
    },
    {
      title: "10. Çerezler ve Benzeri Teknolojiler",
      body: [
        "Oturumunuzu açık tutmak ve Hizmetleri güvence altına almak için kesinlikle gerekli çerezleri, kullanımı anlamak için ise isteğe bağlı analiz çerezlerini kullanırız. Çerezleri tarayıcı ayarlarınızdan yönetebilirsiniz; gerekli çerezleri devre dışı bırakmak Hizmetlerin bazı bölümlerinin çalışmamasına yol açabilir.",
      ],
    },
    {
      title: "11. Uluslararası Aktarımlar",
      body: [
        "Verileriniz, bulunduğunuz ülke dışındaki ülkelerde yer alan sunucularda işlenebilir. Bu tür aktarımlar gerçekleştiğinde, yürürlükteki veri koruma mevzuatının gerektirdiği uygun güvenceleri uygularız.",
      ],
    },
    {
      title: "12. Bu Politikadaki Değişiklikler",
      body: [
        "Bu Politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler bu sayfada yeni bir yürürlük tarihiyle ve uygun olduğu durumlarda e-posta veya uygulama içi bildirimle duyurulur.",
      ],
    },
    {
      title: "13. Bize Ulaşın",
      body: [
        `Sorular, gizlilik talepleri veya şikâyetler için: ${email}`,
        address ? `Posta adresi: ${address}` : "",
        "Gizlilik taleplerine 30 gün içinde yanıt veririz.",
      ].filter(Boolean),
    },
  ],

  termsTitle: "Kullanım Koşulları",
  termsMetaTitle: "Kullanım Koşulları | Webyar",
  termsMetaDescription:
    "Webyar web sitesi, mobil uygulamaları ve hizmetlerinin kullanımını düzenleyen; abonelikler, kabul edilebilir kullanım ve sorumluluk dahil hüküm ve koşullar.",
  termsSections: (brand, email) => [
    {
      title: "1. Koşulların Kabulü",
      body: [
        `Bu Kullanım Koşulları ("Koşullar"), web sitemizi, mobil uygulamalarımızı ve ilgili hizmetlerimizi ("Hizmetler") kullanımınıza ilişkin olarak sizinle ${brand} arasında bağlayıcı bir sözleşme oluşturur. Bir hesap oluşturarak veya Hizmetleri kullanarak bu Koşulları kabul etmiş olursunuz.`,
      ],
    },
    {
      title: "2. Uygunluk",
      body: [
        "Hizmetleri kullanmak için en az 13 yaşında olmanız ve bulunduğunuz yargı bölgesinde bağlayıcı bir sözleşme yapabilecek yaşta olmanız gerekir. Hizmetleri bir kuruluş adına kullanıyorsanız, o kuruluşu bağlamaya yetkili olduğunuzu teyit etmiş olursunuz.",
      ],
    },
    {
      title: "3. Hesaplar ve Güvenlik",
      body: [
        "Kayıt bilgilerinizin doğruluğundan, giriş bilgilerinizin gizli tutulmasından ve hesabınız altında gerçekleşen tüm etkinliklerden siz sorumlusunuz. Yetkisiz erişimden şüphelenirseniz aşağıdaki iletişim adresinden derhâl bize bildirin.",
      ],
    },
    {
      title: "4. Kabul Edilebilir Kullanım",
      body: [
        "Şunları yapmamayı kabul edersiniz: yürürlükteki yasaları ihlal etmek; spam, kötü amaçlı yazılım veya istenmeyen toplu mesajlar göndermek; başkalarını taciz etmek, tehdit etmek veya onlara kötü davranmak; hukuka aykırı, hak ihlali içeren, nefret söylemi barındıran veya müstehcen içerik yüklemek; diğer kullanıcıların verilerine erişmeye çalışmak; Hizmetlere tersine mühendislik uygulamak, veri kazımak (scraping) veya Hizmetleri aşırı yüklemek; ya da yazılı izin olmadan Hizmetleri yeniden satmak.",
        "Bu bölümü ihlal eden hesapları askıya alabilir veya kapatabiliriz.",
      ],
    },
    {
      title: "5. Kullanıcı İçeriği",
      body: [
        "Gönderdiğiniz içeriğin sahipliği sizde kalır. Bu içeriği yalnızca Hizmetleri işletmek ve desteklemek amacıyla barındırmamız, işlememiz, iletmemiz ve görüntülememiz için bize sınırlı, dünya çapında ve münhasır olmayan bir lisans verirsiniz.",
        "İçeriğinizden ve onu göndermek için gerekli haklara sahip olmaktan siz sorumlusunuz.",
      ],
    },
    {
      title: "6. Abonelikler, Faturalandırma ve İptal",
      body: [
        "Ücretli planlar düzenli aralıklarla peşin olarak faturalandırılır ve iptal edilene kadar otomatik olarak yenilenir. Hesap ayarlarınızdan veya destek ekibiyle iletişime geçerek dilediğiniz zaman iptal edebilirsiniz; iptal, mevcut faturalandırma döneminin sonunda geçerli olur.",
        "Apple App Store veya Google Play üzerinden yapılan satın almalar ilgili mağaza tarafından faturalandırılır ve mağazanın kendi faturalandırma, yenileme ve iade kurallarına tabidir; bu abonelikleri mağaza hesabı ayarlarınızdan yönetebilir veya iptal edebilirsiniz.",
      ],
    },
    {
      title: "7. Üçüncü Taraf Hizmetleri",
      body: [
        "Hizmetler üçüncü taraf platformlar ve eklentilerle entegre olabilir. Bu hizmetler kendi koşullarına ve gizlilik politikalarına tabidir; bunların erişilebilirliğinden veya işleyişinden sorumlu değiliz.",
      ],
    },
    {
      title: "8. Fikrî Mülkiyet",
      body: [
        `${brand} tarafından sağlanan tüm yazılım, tasarım, ticari marka ve içerikler bizim veya lisans verenlerimizin mülkiyetinde kalır ve fikrî mülkiyet yasalarıyla korunur. Bu Koşullarda açıkça belirtilenler dışında hiçbir hak tanınmaz.`,
      ],
    },
    {
      title: "9. Hizmetin Erişilebilirliği",
      body: [
        'Hizmetleri erişilebilir ve güvenilir tutmak için çalışırız; ancak Hizmetler, yasaların izin verdiği ölçüde hiçbir türde garanti verilmeksizin "olduğu gibi" ve "mevcut olduğu şekliyle" sunulur. Planlı bakımlar, mümkün olduğunda önceden duyurulur.',
      ],
    },
    {
      title: "10. Sorumluluğun Sınırlandırılması",
      body: [
        `Yasaların izin verdiği azami ölçüde ${brand}; dolaylı, arızi, özel veya sonuç olarak ortaya çıkan zararlardan ya da kâr veya veri kaybından sorumlu değildir. Herhangi bir talebe ilişkin toplam sorumluluğumuz, talepten önceki on iki ay içinde Hizmetler için ödediğiniz tutarla sınırlıdır.`,
      ],
    },
    {
      title: "11. Fesih",
      body: [
        "Hizmetleri kullanmayı dilediğiniz zaman bırakabilir ve hesabınızı silebilirsiniz. Bu Koşulların ihlali, yasal nedenler veya uzun süreli hareketsizlik durumunda, makul ölçüde mümkün olduğunda bildirimde bulunarak erişimi askıya alabilir veya sonlandırabiliriz.",
      ],
    },
    {
      title: "12. Bu Koşullardaki Değişiklikler",
      body: [
        "Bu Koşulları güncelleyebiliriz. Önemli değişiklikler bu sayfada yeni bir yürürlük tarihiyle yayımlanır ve uygun olduğu durumlarda e-posta veya uygulama içi bildirimle duyurulur. Değişiklikler yürürlüğe girdikten sonra Hizmetleri kullanmaya devam etmeniz, bu değişiklikleri kabul ettiğiniz anlamına gelir.",
      ],
    },
    {
      title: "13. Uygulanacak Hukuk",
      body: [
        "Bu Koşullar, kanunlar ihtilafı kurallarına bakılmaksızın ana faaliyet merkezimizin bulunduğu yerde geçerli olan yasalara tabidir. İkamet ettiğiniz ülkedeki zorunlu tüketici koruma hükümleri yine de geçerlidir.",
      ],
    },
    {
      title: "14. İletişim",
      body: [`Bu Koşullarla ilgili sorularınız için ${email} adresiyle iletişime geçin.`],
    },
  ],

  helpMetaTitle: "Destek ve Yardım Merkezi | Webyar",
  helpMetaDescription:
    "Webyar için yardım alın: e-postayla destek ekibine ulaşın, bir sorunu bildirin, hesap silme talebinde bulunun ve sık sorulan soruların yanıtlarını okuyun.",
  supportName: (brand) => `${brand} Destek`,
  supportCrumb: "Destek",
  helpTitle: "Destek ve Yardım Merkezi",
  helpIntro: (brand) =>
    `${brand} ile ilgili yardıma mı ihtiyacınız var? Destek ekibimiz her mesajı yanıtlar. Teknik sorunlar, faturalandırma soruları, gizlilik talepleri veya hesap silme için aşağıdaki iletişim bilgilerini kullanın.`,
  supportEmail: "Destek e-postası",
  supportEmailNote: "App Store inceleme ekipleri dahil tüm kullanıcılar için ana destek kanalı.",
  responseTime: "Yanıt süresi",
  responseTimeValue: "1 iş günü içinde (cumartesiden perşembeye).",
  phoneLabel: "Telefon: ",
  addressLabel: "Adres: ",
  accountDeletion: "Hesap silme",
  deletionSubject: "Hesap Silme Talebi",
  deletionBefore: "“Hesap Silme Talebi” konulu bir e-postayı ",
  deletionAfter: " adresine gönderin. Verileriniz 30 gün içinde silinir.",
  policies: "Politikalar",
  privacyLink: "Gizlilik Politikası",
  termsLink: "Kullanım Koşulları",
  faqTitle: "Sık sorulan sorular",
  faqs: [
    {
      q: "Nasıl hesap oluşturabilirim?",
      a: "Web sitesini açın, Kaydol'u seçin, e-posta adresinizi ve bir parola girin, ardından e-postanızı doğrulayın. Sonra aynı hesapla uygulamalarda oturum açın. Ücretsiz planla başlayıp daha sonra yükseltebilirsiniz.",
    },
    {
      q: "Parolamı unuttum. Ne yapmalıyım?",
      a: 'Giriş ekranındaki "Parolamı unuttum" bağlantısını kullanın. Kayıtlı e-posta adresinize bir sıfırlama bağlantısı gönderilir ve bu bağlantı 24 saat geçerlidir.',
    },
    {
      q: "Aboneliğimi nasıl yönetir veya iptal ederim?",
      a: "Planınızı ve faturalarınızı panelinizdeki Faturalandırma bölümünden yönetin. Her dönem, faturası ödendiğinde yenilenir; sonraki fatura ödenmezse çalışma alanınız ek süre bittikten sonra ücretsiz plana döner. Daha düşük bir plana geçiş, mevcut dönemin sonunda geçerli olur.",
    },
    {
      q: "Hesabımı ve verilerimi nasıl silerim?",
      a: 'Hesabınıza bağlı adresten destek adresimize "Hesap Silme Talebi" konulu bir e-posta gönderin. Talebi doğrular ve hesabınızı ve kişisel verilerinizi 30 gün içinde kalıcı olarak sileriz.',
    },
    {
      q: "Verilerim güvende mi?",
      a: "Veriler TLS üzerinden iletilir, parolalar yalnızca tuzlanmış özetler (salted hash) olarak saklanır, erişim rollere göre kısıtlanır ve düzenli olarak yedek alınır. Tüm ayrıntılar için Gizlilik Politikamıza göz atın.",
    },
    {
      q: "Bir hatayı veya kötüye kullanımı nasıl bildiririm?",
      a: 'Destek ekibine "Hata bildirimi" veya "Kötüye kullanım bildirimi" konulu bir e-posta gönderin; hesap e-postanızı, cihazınızı ve uygulama sürümünüzü, sorunu yeniden oluşturma adımlarını ve varsa ekran görüntülerini ekleyin.',
    },
  ],
  stuckBefore: "Hâlâ sorun mu yaşıyorsunuz? ",
  stuckAfter:
    " adresine yazın; size daha hızlı yardımcı olabilmemiz için hesap e-postanızı, cihaz modelinizi, işletim sistemi sürümünüzü ve uygulama sürümünüzü belirtin.",
};
