import type { Metadata } from "next";
import Link from "next/link";

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
        <p className="text-gray-500 text-sm mb-10">Last updated: June 12, 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h3>
            <p>
              By accessing or using ViralPrinter (&quot;the Service&quot;), you agree to be bound by
              these Terms of Service and our{" "}
              <Link href="/privacy" className="text-pink-400 hover:text-pink-300">
                Privacy Policy
              </Link>
              . If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">2. Description of Service</h3>
            <p>
              ViralPrinter is an automated content generation tool that uses artificial intelligence
              to create short-form video content and publish it to TikTok on your behalf. The
              Service includes AI-powered script writing, text-to-speech audio generation, stock
              footage assembly, and automated posting to your connected TikTok account via the
              TikTok Content Posting API.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">3. Eligibility</h3>
            <p>
              You must be at least 18 years old to use this Service. By using ViralPrinter, you
              represent and warrant that you are at least 18 years of age and have the legal capacity
              to enter into these Terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">4. TikTok Account Authorization</h3>
            <p className="mb-3">
              By connecting your TikTok account, you grant ViralPrinter permission to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload videos to your TikTok account</li>
              <li>Set video titles, descriptions, and hashtags</li>
              <li>Configure video privacy settings (public by default)</li>
              <li>Enable comments, duets, and stitches on posted content</li>
            </ul>
            <p className="mt-3">
              You may revoke this access at any time through your TikTok account settings under
              &quot;Manage app permissions&quot; or by disconnecting the integration. Revoking access
              does not delete previously posted content.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">5. Content Responsibility</h3>
            <p className="mb-3">
              You are solely responsible for all content posted to your TikTok account through
              ViralPrinter. You agree not to use the Service to generate or post content that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violates TikTok&apos;s Community Guidelines or Terms of Service</li>
              <li>Is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Infringes on intellectual property or other third-party rights</li>
              <li>Contains misinformation, hate speech, or discriminatory content</li>
              <li>Promotes violence, self-harm, or dangerous activities</li>
              <li>Targets or exploits minors in any way</li>
              <li>Violates any applicable local, state, national, or international law</li>
            </ul>
            <p className="mt-3">
              We reserve the right to refuse content generation or suspend access if we believe the
              Service is being used to produce prohibited content.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">6. AI-Generated Content Disclosure</h3>
            <p>
              Content produced by ViralPrinter is generated using artificial intelligence models. AI
              outputs may be inaccurate, inappropriate, or contain errors. You are responsible for
              reviewing generated content before it is posted. ViralPrinter does not guarantee the
              accuracy, quality, or suitability of AI-generated content for any purpose.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">7. Intellectual Property</h3>
            <p>
              Videos generated through ViralPrinter may incorporate AI-generated scripts,
              royalty-free stock footage from Pexels, and synthesized audio. You are granted a
              non-exclusive license to use, publish, and distribute the generated videos. You
              acknowledge that AI-generated content may not be eligible for copyright protection in
              all jurisdictions.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">8. Data Usage</h3>
            <p>
              Your use of ViralPrinter is also governed by our{" "}
              <Link href="/privacy" className="text-pink-400 hover:text-pink-300">
                Privacy Policy
              </Link>
              , which describes how we collect, use, and protect your information. By using the
              Service, you consent to the data practices described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">9. Prohibited Uses</h3>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for spam, bulk posting, or platform manipulation</li>
              <li>Attempt to circumvent rate limits or usage restrictions</li>
              <li>Use the Service to impersonate others or create misleading content</li>
              <li>Reverse-engineer, decompile, or extract source code from the Service</li>
              <li>Use the Service in violation of TikTok&apos;s developer terms or API policies</li>
              <li>Share your access credentials with unauthorized parties</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">10. Service Availability</h3>
            <p>
              We strive to keep ViralPrinter available but do not guarantee uninterrupted or
              error-free operation. The Service may be temporarily unavailable due to maintenance,
              updates, or circumstances beyond our control. We may modify, suspend, or discontinue
              the Service at any time without prior notice.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">11. Disclaimer of Warranties</h3>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT AI-GENERATED CONTENT WILL BE ACCURATE,
              APPROPRIATE, OR ACHIEVE ANY PARTICULAR RESULT ON TIKTOK OR ANY OTHER PLATFORM.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">12. Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIRALPRINTER SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR
              USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO LOSS OF REVENUE, DATA, OR BUSINESS
              OPPORTUNITIES, CONTENT POSTED TO TIKTOK ON YOUR BEHALF, OR ANY ACTIONS TAKEN BY
              TIKTOK REGARDING YOUR ACCOUNT.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">13. Indemnification</h3>
            <p>
              You agree to indemnify and hold harmless ViralPrinter and its operators from any
              claims, damages, losses, or expenses arising from your use of the Service, content
              posted through the Service, or violation of these Terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">14. Termination</h3>
            <p>
              We may terminate or suspend your access to the Service at any time, with or without
              cause. Upon termination, your right to use the Service ceases immediately. Previously
              posted TikTok content will remain on TikTok unless you delete it manually.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">15. Changes to Terms</h3>
            <p>
              We may update these Terms at any time. We will notify you of material changes by
              posting the updated terms on this page with a revised &quot;Last updated&quot; date.
              Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">16. Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">17. Contact</h3>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href="mailto:sachin.agrawal272@gmail.com" className="text-pink-400 hover:text-pink-300">
                sachin.agrawal272@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
          <Link href="/privacy" className="text-pink-400 hover:text-pink-300">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
