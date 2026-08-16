// 公開の問い合わせフォームのページ。

import { ContactForm } from "./_components/ContactForm";

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-indigo-50 via-white to-white px-8 py-16">
      <div className="w-full max-w-xl">
        <ContactForm />
      </div>
    </main>
  );
}
