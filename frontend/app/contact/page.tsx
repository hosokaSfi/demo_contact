// 公開の問い合わせフォームのページ。

import { ContactForm } from "./_components/ContactForm";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-bold">お問い合わせ</h1>
      <ContactForm />
    </main>
  );
}
