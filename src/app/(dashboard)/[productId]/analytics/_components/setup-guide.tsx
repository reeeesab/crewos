export function SetupGuide() {
  return (
    <div className="rounded-2xl border border-sf-border-subtle bg-sf-surface/60 shadow-lg backdrop-blur-xl">
      {[
        {
          step: "1",
          title: "Create a Google Cloud project",
          body: (
            <>
              Go to{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sf-accent-cyan underline underline-offset-2"
              >
                console.cloud.google.com
              </a>{" "}
              and create a project (for example: <code className="rounded bg-sf-base px-1">indiqo-analytics</code>).
            </>
          ),
        },
        {
          step: "2",
          title: "Enable Google Analytics Data API",
          body: (
            <>
              In your project, go to <strong>APIs & Services → Library</strong>, search for{" "}
              <strong>Google Analytics Data API</strong>, and click <strong>Enable</strong>.
            </>
          ),
        },
        {
          step: "3",
          title: "Create a service account",
          body: (
            <>
              Open <strong>IAM & Admin → Service Accounts</strong>, create one, then go to{" "}
              <strong>Keys → Add key → Create new key → JSON</strong>. Download the JSON file and keep it safe.
            </>
          ),
        },
        {
          step: "4",
          title: "Grant GA4 property access",
          body: (
            <>
              In GA4 Admin, open <strong>Property access management</strong>, add the JSON{" "}
              <code className="rounded bg-sf-base px-1">client_email</code>, and assign <strong>Viewer</strong>.
            </>
          ),
        },
        {
          step: "5",
          title: "Find your GA4 Property ID",
          body: (
            <>
              In GA4, go to <strong>Admin → Property Settings</strong>. Copy the numeric Property ID
              (example: <code className="rounded bg-sf-base px-1">123456789</code>).
            </>
          ),
        },
        {
          step: "6",
          title: "Paste the 3 required fields in Indiqo",
          body: (
            <>
              From your JSON, use <code className="rounded bg-sf-base px-1">client_email</code> and{" "}
              <code className="rounded bg-sf-base px-1">private_key</code>, plus your GA4 Property ID.
              Credentials are stored encrypted server-side.
            </>
          ),
        },
      ].map((item, index) => (
        <div
          key={item.step}
          className={`space-y-2 px-5 py-4 ${index < 5 ? "border-b border-sf-border-subtle/70" : ""}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sf-accent-cyan/15 text-[10px] font-bold text-sf-accent-cyan">
              {item.step}
            </span>
            <p className="text-sm font-semibold text-sf-text-primary">{item.title}</p>
          </div>
          <p className="pl-7 text-xs leading-relaxed text-sf-text-secondary">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
