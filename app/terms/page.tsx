import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — ViralPrinter",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <img src="/viralprinter-icon.png" alt="ViralPrinter" className="w-10 h-10 rounded-xl" />
          <h1 className="text-2xl font-bold">ViralPrinter</h1>
        </div>

        <h2 className="text-3xl font-bold mb-2">Terms of Service</h2>
        <p className="text-gray-500 text-sm mb-10">Last updated: June 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h3>
            <p>By accessing or using ViralPrinter, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">2. Description of Service</h3>
            <p>ViralPrinter is an automated content generation tool that uses AI to create and publish short-form video content to TikTok on your behalf. You authorize the service to post content to your connected TikTok account.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">3. TikTok Account Authorization</h3>
            <p>You grant ViralPrinter permission to upload and publish videos to your TikTok account through the TikTok Content Posting API. You may revoke this access at any time through your TikTok account settings or by disconnecting the integration.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">4. Content Responsibility</h3>
            <p>You are responsible for all content posted to your TikTok account through ViralPrinter. You agree not to use the service to generate or post content that violates TikTok's Community Guidelines, is illegal, or infringes third-party rights.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">5. Data Usage</h3>
            <p>ViralPrinter stores your account preferences and post history. We do not sell your data. We use third-party AI providers (Anthropic, AWS) to generate content. Your prompts may be processed by these providers in accordance with their respective privacy policies.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">6. Disclaimer of Warranties</h3>
            <p>The service is provided "as is" without warranties of any kind. We do not guarantee that AI-generated content will be accurate, appropriate, or achieve any particular result on TikTok.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">7. Limitation of Liability</h3>
            <p>ViralPrinter shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service or content posted to TikTok on your behalf.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">8. Changes to Terms</h3>
            <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">9. Contact</h3>
            <p>Questions? Contact us at <a href="mailto:sachin.agrawal272@gmail.com" className="text-pink-400 hover:text-pink-300">sachin.agrawal272@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
