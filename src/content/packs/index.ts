import type { Locale } from '@/i18n';
import type { CardBody, TableBody } from '@/data/types';

/**
 * Starter Packs: small, neutral sets of Cards that show variables, tables and quick copy.
 * Content is plain data (no ids); the installer creates real Boxes, Tabs and Cards.
 */
export interface PackCard {
  title: string;
  type: 'text' | 'table';
  body: CardBody;
  tags?: string[];
  pinned?: boolean;
}

export interface PackTab {
  name: string;
  icon: string;
  cards: PackCard[];
}

export interface Pack {
  id: PackId;
  icon: string;
  color: 'mint' | 'cyan' | 'violet' | 'pink' | 'salmon' | 'amber' | 'lime' | 'slate';
  name: Record<Locale, string>;
  tabs: Record<Locale, PackTab[]>;
}

export type PackId = 'email' | 'shell' | 'meeting' | 'study' | 'social' | 'personal';

const text = (md: string): CardBody => ({ md });

function table(columns: { name: string; type: 'text' | 'number' | 'date' | 'time' }[], rows: string[][], footer: Record<number, string> = {}): TableBody {
  const cols = columns.map((c, i) => ({ id: `c${i + 1}`, name: c.name, type: c.type, order: `a${String(i).padStart(2, '0')}` }));
  return {
    columns: cols,
    rows: rows.map((r, ri) => ({ id: `r${ri + 1}`, order: `a${String(ri).padStart(3, '0')}`, cells: Object.fromEntries(cols.map((c, ci) => [c.id, r[ci] ?? ''])) })),
    footer: Object.fromEntries(Object.entries(footer).map(([i, f]) => [cols[Number(i)]!.id, f])),
  };
}

export const packs: Pack[] = [
  {
    id: 'email',
    icon: 'mail',
    color: 'mint',
    name: { en: 'Email replies', id: 'Balasan email' },
    tabs: {
      en: [
        {
          name: 'Replies',
          icon: 'reply',
          cards: [
            { title: 'Thanks, received', type: 'text', tags: ['email'], pinned: true, body: text('Hi {{name}},\n\nThanks for your message. I received it and will get back to you by {{date+2|fmt:dddd, D MMMM}}.\n\nBest regards') },
            { title: 'Reschedule a meeting', type: 'text', tags: ['email', 'meeting'], body: text('Hi {{name}},\n\nSomething came up on my side. Could we move our meeting to {{new_time|default:tomorrow at the same time}}?\n\nSorry for the short notice, and thanks for understanding.') },
            { title: 'Polite decline', type: 'text', tags: ['email'], body: text('Hi {{name}},\n\nThank you for thinking of me for {{topic}}. I have to pass this time because of {{reason|choice:other commitments,timing,scope}}.\n\nI hope it goes well, and I would be glad to hear from you again.') },
            { title: 'Follow up after no reply', type: 'text', tags: ['email', 'followup'], body: text('Hi {{name}},\n\nA quick follow-up on my message from {{sent_on|default:last week}} about {{topic}}. If now is not a good time, just tell me when to check back.\n\nThanks!') },
          ],
        },
      ],
      id: [
        {
          name: 'Balasan',
          icon: 'reply',
          cards: [
            { title: 'Terima kasih, sudah diterima', type: 'text', tags: ['email'], pinned: true, body: text('Halo {{nama}},\n\nTerima kasih atas pesannya. Sudah saya terima dan akan saya balas paling lambat {{date+2|fmt:dddd, D MMMM}}.\n\nSalam') },
            { title: 'Menjadwalkan ulang rapat', type: 'text', tags: ['email', 'rapat'], body: text('Halo {{nama}},\n\nAda hal mendadak di pihak saya. Bisakah rapat kita dipindah ke {{waktu_baru|default:besok di jam yang sama}}?\n\nMohon maaf atas pemberitahuan yang singkat, dan terima kasih atas pengertiannya.') },
            { title: 'Menolak dengan sopan', type: 'text', tags: ['email'], body: text('Halo {{nama}},\n\nTerima kasih sudah mengingat saya untuk {{topik}}. Kali ini saya harus melewatkannya karena {{alasan|choice:komitmen lain,waktu,cakupan}}.\n\nSemoga berjalan lancar, dan saya senang bila kita bisa berkabar lagi.') },
            { title: 'Menyusul karena belum dibalas', type: 'text', tags: ['email', 'tindaklanjut'], body: text('Halo {{nama}},\n\nSekadar menindaklanjuti pesan saya pada {{dikirim|default:minggu lalu}} tentang {{topik}}. Jika sekarang belum pas, beri tahu saya kapan sebaiknya saya menghubungi lagi.\n\nTerima kasih!') },
          ],
        },
      ],
    },
  },
  {
    id: 'shell',
    icon: 'terminal',
    color: 'cyan',
    name: { en: 'Shell and Git', id: 'Shell dan Git' },
    tabs: {
      en: [
        {
          name: 'Git',
          icon: 'git-branch',
          cards: [
            { title: 'Undo the last commit, keep changes', type: 'text', tags: ['git'], pinned: true, body: text('```sh\ngit reset --soft HEAD~1\n```') },
            { title: 'Rename the current branch', type: 'text', tags: ['git'], body: text('```sh\ngit branch -m {{new_name}}\ngit push origin -u {{new_name}}\n```') },
            { title: 'Clean merged branches', type: 'text', tags: ['git'], body: text('```sh\ngit branch --merged main | grep -v "main" | xargs -n 1 git branch -d\n```') },
          ],
        },
        {
          name: 'Shell',
          icon: 'terminal',
          cards: [
            { title: 'Find large files', type: 'text', tags: ['shell'], body: text('```sh\ndu -ah {{path|default:.}} | sort -rh | head -n 20\n```') },
            { title: 'Which process uses a port', type: 'text', tags: ['shell', 'network'], body: text('```sh\nlsof -i :{{port|default:3000}}\n```') },
            { title: 'Serve the current folder', type: 'text', tags: ['shell', 'http'], body: text('```sh\npython3 -m http.server {{port|default:8080}}\n```') },
          ],
        },
      ],
      id: [
        {
          name: 'Git',
          icon: 'git-branch',
          cards: [
            { title: 'Batalkan commit terakhir, simpan perubahan', type: 'text', tags: ['git'], pinned: true, body: text('```sh\ngit reset --soft HEAD~1\n```') },
            { title: 'Ganti nama branch saat ini', type: 'text', tags: ['git'], body: text('```sh\ngit branch -m {{nama_baru}}\ngit push origin -u {{nama_baru}}\n```') },
            { title: 'Bersihkan branch yang sudah digabung', type: 'text', tags: ['git'], body: text('```sh\ngit branch --merged main | grep -v "main" | xargs -n 1 git branch -d\n```') },
          ],
        },
        {
          name: 'Shell',
          icon: 'terminal',
          cards: [
            { title: 'Cari file besar', type: 'text', tags: ['shell'], body: text('```sh\ndu -ah {{path|default:.}} | sort -rh | head -n 20\n```') },
            { title: 'Proses apa yang memakai port', type: 'text', tags: ['shell', 'jaringan'], body: text('```sh\nlsof -i :{{port|default:3000}}\n```') },
            { title: 'Sajikan folder saat ini', type: 'text', tags: ['shell', 'http'], body: text('```sh\npython3 -m http.server {{port|default:8080}}\n```') },
          ],
        },
      ],
    },
  },
  {
    id: 'meeting',
    icon: 'users',
    color: 'violet',
    name: { en: 'Meeting follow-up', id: 'Tindak lanjut rapat' },
    tabs: {
      en: [
        {
          name: 'Templates',
          icon: 'file-text',
          cards: [
            { title: 'Meeting summary', type: 'text', tags: ['meeting'], pinned: true, body: text('# {{topic}} ({{date}})\n\n**Attendees:** {{attendees}}\n\n## Decisions\n- \n\n## Action items\n- [ ] {{owner}}: \n\n## Next meeting\n{{next|default:to be scheduled}}') },
            { title: 'Agenda request', type: 'text', tags: ['meeting', 'email'], body: text('Hi all,\n\nBefore {{meeting|default:our next meeting}} on {{date+1|fmt:dddd}}, please add your points to the agenda by {{deadline|default:end of day}}.\n\nThanks!') },
          ],
        },
        {
          name: 'Hours',
          icon: 'clock',
          cards: [
            {
              title: 'Hours this week',
              type: 'table',
              tags: ['time'],
              body: table(
                [
                  { name: 'Date', type: 'date' },
                  { name: 'Start', type: 'time' },
                  { name: 'End', type: 'time' },
                  { name: 'Task', type: 'text' },
                ],
                [
                  ['2026-09-01', '09:00', '12:30', 'Planning'],
                  ['2026-09-02', '13:00', '17:15', 'Review'],
                  ['2026-09-03', '09:30', '11:00', 'Interviews'],
                ],
                { 0: 'cnt//all', 1: 'first//1', 2: 'last//1' },
              ),
            },
          ],
        },
      ],
      id: [
        {
          name: 'Templat',
          icon: 'file-text',
          cards: [
            { title: 'Ringkasan rapat', type: 'text', tags: ['rapat'], pinned: true, body: text('# {{topik}} ({{date}})\n\n**Hadir:** {{peserta}}\n\n## Keputusan\n- \n\n## Tindak lanjut\n- [ ] {{penanggung_jawab}}: \n\n## Rapat berikutnya\n{{berikutnya|default:akan dijadwalkan}}') },
            { title: 'Permintaan agenda', type: 'text', tags: ['rapat', 'email'], body: text('Halo semua,\n\nSebelum {{rapat|default:rapat kita berikutnya}} pada {{date+1|fmt:dddd}}, mohon tambahkan poin kalian ke agenda paling lambat {{tenggat|default:akhir hari ini}}.\n\nTerima kasih!') },
          ],
        },
        {
          name: 'Jam kerja',
          icon: 'clock',
          cards: [
            {
              title: 'Jam kerja minggu ini',
              type: 'table',
              tags: ['waktu'],
              body: table(
                [
                  { name: 'Tanggal', type: 'date' },
                  { name: 'Mulai', type: 'time' },
                  { name: 'Selesai', type: 'time' },
                  { name: 'Tugas', type: 'text' },
                ],
                [
                  ['2026-09-01', '09:00', '12:30', 'Perencanaan'],
                  ['2026-09-02', '13:00', '17:15', 'Tinjauan'],
                  ['2026-09-03', '09:30', '11:00', 'Wawancara'],
                ],
                { 0: 'cnt//all', 1: 'first//1', 2: 'last//1' },
              ),
            },
          ],
        },
      ],
    },
  },
  {
    id: 'study',
    icon: 'graduation-cap',
    color: 'amber',
    name: { en: 'Study', id: 'Belajar' },
    tabs: {
      en: [
        {
          name: 'Citations',
          icon: 'quote',
          cards: [
            { title: 'APA reference', type: 'text', tags: ['citation'], body: text('{{author}} ({{year}}). *{{title}}*. {{publisher}}.') },
            { title: 'Web page citation', type: 'text', tags: ['citation'], body: text('{{author|default:Organisation}}. ({{year}}). {{title}}. Retrieved {{date|fmt:D MMMM YYYY}}, from {{url}}') },
          ],
        },
        {
          name: 'Schedule',
          icon: 'calendar',
          cards: [
            {
              title: 'Revision plan',
              type: 'table',
              tags: ['plan'],
              body: table(
                [
                  { name: 'Day', type: 'date' },
                  { name: 'Subject', type: 'text' },
                  { name: 'Minutes', type: 'number' },
                ],
                [
                  ['2026-09-07', 'Statistics', '45'],
                  ['2026-09-08', 'History', '30'],
                  ['2026-09-09', 'Statistics', '60'],
                ],
                { 0: 'days//all', 2: 'sum//all' },
              ),
            },
          ],
        },
      ],
      id: [
        {
          name: 'Kutipan',
          icon: 'quote',
          cards: [
            { title: 'Referensi APA', type: 'text', tags: ['kutipan'], body: text('{{penulis}} ({{tahun}}). *{{judul}}*. {{penerbit}}.') },
            { title: 'Kutipan halaman web', type: 'text', tags: ['kutipan'], body: text('{{penulis|default:Organisasi}}. ({{tahun}}). {{judul}}. Diakses {{date|fmt:D MMMM YYYY}}, dari {{url}}') },
          ],
        },
        {
          name: 'Jadwal',
          icon: 'calendar',
          cards: [
            {
              title: 'Rencana belajar',
              type: 'table',
              tags: ['rencana'],
              body: table(
                [
                  { name: 'Hari', type: 'date' },
                  { name: 'Mata pelajaran', type: 'text' },
                  { name: 'Menit', type: 'number' },
                ],
                [
                  ['2026-09-07', 'Statistika', '45'],
                  ['2026-09-08', 'Sejarah', '30'],
                  ['2026-09-09', 'Statistika', '60'],
                ],
                { 0: 'days//all', 2: 'sum//all' },
              ),
            },
          ],
        },
      ],
    },
  },
  {
    id: 'social',
    icon: 'megaphone',
    color: 'pink',
    name: { en: 'Social captions', id: 'Caption media sosial' },
    tabs: {
      en: [
        {
          name: 'Captions',
          icon: 'message-square',
          cards: [
            { title: 'Product update', type: 'text', tags: ['caption'], body: text('{{tone|choice:Big news,Small update,Heads up}}: {{feature}} is live. {{benefit}}\n\nTry it today: {{link}}') },
            { title: 'Event reminder', type: 'text', tags: ['caption', 'event'], body: text('{{event}} starts {{when|default:tomorrow}} at {{time}}. Save your spot: {{link}}\n\n#{{hashtag|default:community}}') },
            { title: 'Thank you post', type: 'text', tags: ['caption'], body: text('Thank you to everyone who joined {{event}}. {{highlight}}\n\nSee you at the next one.') },
          ],
        },
      ],
      id: [
        {
          name: 'Caption',
          icon: 'message-square',
          cards: [
            { title: 'Pembaruan produk', type: 'text', tags: ['caption'], body: text('{{nada|choice:Kabar besar,Pembaruan kecil,Perhatian}}: {{fitur}} sudah tersedia. {{manfaat}}\n\nCoba hari ini: {{tautan}}') },
            { title: 'Pengingat acara', type: 'text', tags: ['caption', 'acara'], body: text('{{acara}} dimulai {{kapan|default:besok}} pukul {{jam}}. Amankan tempatmu: {{tautan}}\n\n#{{tagar|default:komunitas}}') },
            { title: 'Ucapan terima kasih', type: 'text', tags: ['caption'], body: text('Terima kasih kepada semua yang hadir di {{acara}}. {{sorotan}}\n\nSampai jumpa di acara berikutnya.') },
          ],
        },
      ],
    },
  },
  {
    id: 'personal',
    icon: 'id-card',
    color: 'slate',
    name: { en: 'Personal details', id: 'Data pribadi' },
    tabs: {
      en: [
        {
          name: 'Often pasted',
          icon: 'clipboard',
          cards: [
            { title: 'Postal address', type: 'text', tags: ['address'], pinned: true, body: text('{{full_name}}\n{{street}}\n{{postcode}} {{city}}\n{{country}}') },
            { title: 'Signature', type: 'text', tags: ['email'], body: text('{{full_name}}\n{{role}} at {{organisation}}\n{{phone}} | {{email}}') },
            { title: 'Out of office', type: 'text', tags: ['email'], body: text('I am away until {{back_on|fmt:dddd, D MMMM}} with limited access to email. For urgent matters contact {{backup_contact}}.') },
          ],
        },
      ],
      id: [
        {
          name: 'Sering ditempel',
          icon: 'clipboard',
          cards: [
            { title: 'Alamat pos', type: 'text', tags: ['alamat'], pinned: true, body: text('{{nama_lengkap}}\n{{jalan}}\n{{kota}} {{kode_pos}}\n{{negara}}') },
            { title: 'Tanda tangan', type: 'text', tags: ['email'], body: text('{{nama_lengkap}}\n{{jabatan}} di {{organisasi}}\n{{telepon}} | {{email}}') },
            { title: 'Sedang tidak di kantor', type: 'text', tags: ['email'], body: text('Saya tidak di tempat sampai {{kembali|fmt:dddd, D MMMM}} dengan akses email terbatas. Untuk hal mendesak hubungi {{kontak_cadangan}}.') },
          ],
        },
      ],
    },
  },
];

export function getPack(id: PackId): Pack | undefined {
  return packs.find((p) => p.id === id);
}
