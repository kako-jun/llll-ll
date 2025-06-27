// Critical CSS Component
export default function CriticalCSS() {
  return (
    <style jsx>{`
      /* Critical Path CSS - Above the fold */
      :root {
        --bg-primary: #ffffff;
        --text-primary: #000000;
        --primary-color: #28a745;
      }

      [data-theme="dark"] {
        --bg-primary: #121212;
        --text-primary: #ffffff;
        --primary-color: #4ade80;
      }

      body {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
      }

      /* Language selector critical styles */
      .language-selector {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--bg-primary);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `}</style>
  );
}
