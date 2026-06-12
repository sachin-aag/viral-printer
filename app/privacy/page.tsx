import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ViralPrinter",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <img src="/viralprinter-icon.png" alt="ViralPrinter" className="w-10 h-10 rounded-xl" />
          <h1 className="text-2xl font-bold">ViralPrinter</h1>
        </div>

        <h2 className="text-3xl font-bold mb-2">Privacy Policy</h2>
        <p className="text-gray-500 text-sm mb-10">Last updated: June 12, 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h3 className="text-lg font-semibold text-white mb-2">1. Introduction</h3>
            <p>
              ViralPrinter (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an automated content
              generation tool that creates and publishes short-form video content to TikTok. This
              Privacy Policy explains how we collect, use, store, and protect your information when
              you use our service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">2. Information We Collect</h3>
            <p className="mb-3">We collect the following categories of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Account Preferences:</strong> Your content niche,
                style description, voice selection, and TTS provider preference. These are stored
                locally in your browser (localStorage) and are never transmitted to our servers
                unless used to generate content.
              </li>
              <li>
                <strong className="text-white">Content Generation Data:</strong> Prompts you submit,
                AI-generated hooks, scripts, and video metadata (run ID, status, timestamps).
              </li>
              <li>
                <strong className="text-white">Post History:</strong> Records of generated videos
                including prompt, hook text, TikTok URL, video mode, and creation timestamp.
              </li>
              <li>
                <strong className="text-white">TikTok Account Data:</strong> We access your TikTok
                account solely to publish videos on your behalf via the TikTok Content Posting API.
                We do not read, collect, or store your TikTok profile information, follower data,
                analytics, direct messages, or any other TikTok user data.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">3. How We Use Your Information</h3>
            <p className="mb-3">Your information is used exclusively to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Generate AI-powered video content based on your prompts and preferences</li>
              <li>Upload and publish videos to your connected TikTok account</li>
              <li>Display your post history within the application</li>
              <li>Improve content generation quality</li>
            </ul>
            <p className="mt-3">
              We do <strong className="text-white">not</strong> use your data for advertising,
              profiling, or any purpose unrelated to the core service.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">4. TikTok API Data Usage</h3>
            <p className="mb-3">
              Our use of the TikTok API is limited to content posting. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                We use the <strong className="text-white">TikTok Content Posting API</strong> to
                upload videos and set video titles/descriptions on your behalf.
              </li>
              <li>
                We set videos to public visibility with comments, duets, and stitches enabled by
                default.
              </li>
              <li>
                We do <strong className="text-white">not</strong> access TikTok user data, view
                analytics, read comments or messages, access follower/following lists, or collect any
                data from TikTok&apos;s platform beyond the post confirmation URL.
              </li>
              <li>
                You may revoke ViralPrinter&apos;s access to your TikTok account at any time through
                your TikTok account settings under &quot;Manage app permissions.&quot;
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">5. Third-Party Services</h3>
            <p className="mb-3">
              We use the following third-party services to operate ViralPrinter. Your data may be
              processed by these providers in accordance with their own privacy policies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Anthropic (Claude AI)</strong> — Processes your
                prompts to generate hooks, scripts, and content ideas. Subject to{" "}
                <a href="https://www.anthropic.com/privacy" className="text-pink-400 hover:text-pink-300" target="_blank" rel="noopener noreferrer">
                  Anthropic&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-white">Amazon Web Services (AWS Polly &amp; S3)</strong> —
                Converts scripts to speech audio and stores generated video files. Subject to{" "}
                <a href="https://aws.amazon.com/privacy/" className="text-pink-400 hover:text-pink-300" target="_blank" rel="noopener noreferrer">
                  AWS Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-white">ElevenLabs</strong> — Alternative text-to-speech
                provider. Subject to{" "}
                <a href="https://elevenlabs.io/privacy-policy" className="text-pink-400 hover:text-pink-300" target="_blank" rel="noopener noreferrer">
                  ElevenLabs Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-white">Pexels</strong> — Provides royalty-free stock video
                footage. No user data is shared with Pexels.
              </li>
              <li>
                <strong className="text-white">Composio</strong> — Facilitates the TikTok API
                integration for content posting. Subject to{" "}
                <a href="https://composio.dev/privacy" className="text-pink-400 hover:text-pink-300" target="_blank" rel="noopener noreferrer">
                  Composio&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-white">ClickHouse</strong> — Stores post history and
                generation metadata.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">6. Data Storage &amp; Retention</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Browser storage:</strong> Account preferences are
                stored in your browser&apos;s localStorage. You can clear this data at any time by
                clearing your browser data or resetting your profile in the app.
              </li>
              <li>
                <strong className="text-white">Server storage:</strong> Post history (prompts,
                hooks, video URLs, timestamps) is stored in our database. Generated video files are
                stored on AWS S3.
              </li>
              <li>
                We retain post history for as long as your account is active. You may request
                deletion of your data at any time by contacting us.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">7. Data Sharing</h3>
            <p>
              We do <strong className="text-white">not</strong> sell, rent, or trade your personal
              information. We only share data with the third-party services listed above as necessary
              to provide the service. We may disclose information if required by law or to protect
              our legal rights.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">8. Data Security</h3>
            <p>
              We implement reasonable technical and organizational measures to protect your data,
              including encrypted connections (HTTPS), secure API key management, and access controls
              on our infrastructure. However, no method of electronic transmission or storage is 100%
              secure.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">9. Children&apos;s Privacy</h3>
            <p>
              ViralPrinter is not intended for use by individuals under the age of 18. We do not
              knowingly collect personal information from children. If you believe a child has
              provided us with personal information, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">10. Your Rights</h3>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Revoke TikTok access at any time through TikTok&apos;s app settings</li>
              <li>Clear your local preferences by resetting your browser data</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">11. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting the updated policy on this page with a revised &quot;Last
              updated&quot; date. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white mb-2">12. Contact Us</h3>
            <p>
              If you have questions about this Privacy Policy or your data, contact us at{" "}
              <a href="mailto:sachin.agrawal272@gmail.com" className="text-pink-400 hover:text-pink-300">
                sachin.agrawal272@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
          <Link href="/terms" className="text-pink-400 hover:text-pink-300">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
