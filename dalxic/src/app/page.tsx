export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#040A0F",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: "640px",
          padding: "0 24px",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#10B981",
            marginBottom: "24px",
            fontWeight: 500,
          }}
        >
          Dalxic
        </p>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 56px)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#ECF5F0",
            marginBottom: "20px",
          }}
        >
          Something{" "}
          <span style={{ color: "#10B981" }}>powerful</span>{" "}
          is being built
        </h1>

        <p
          style={{
            fontSize: "17px",
            color: "rgba(236,245,240,0.5)",
            lineHeight: 1.6,
            marginBottom: "48px",
          }}
        >
          One universal business platform. Ten verticals.
          Six behaviours. One engine.
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            borderRadius: "8px",
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 8px rgba(16,185,129,0.6)",
            }}
          />
          <span
            style={{
              fontSize: "14px",
              color: "rgba(236,245,240,0.6)",
              letterSpacing: "1px",
            }}
          >
            Systems online
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "32px",
          fontSize: "12px",
          color: "rgba(236,245,240,0.2)",
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}
      >
        Dalxic &middot; Ghana
      </div>
    </main>
  )
}
