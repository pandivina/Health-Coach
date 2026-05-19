import { useTheme } from '../contexts/ThemeProvider'

function LegalPage({ title, children }) {
  const { theme } = useTheme()
  return (
    <div className="min-h-screen" style={{ background: theme.bg, color: theme.text }}>
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🐼</span>
          <span className="font-extrabold" style={{ color: theme.text }}>Health Coach</span>
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: theme.text }}>{title}</h1>
        <p className="text-sm mb-8" style={{ color: theme.textMuted }}>
          Última actualización: enero 2026
        </p>
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: theme.textMuted }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  const { theme } = useTheme()
  return (
    <div>
      <h2 className="font-bold text-base mb-2" style={{ color: theme.text }}>{title}</h2>
      {children}
    </div>
  )
}

// ── POLÍTICA DE PRIVACIDAD ───────────────────────────────────
export function PrivacyPolicy() {
  return (
    <LegalPage title="Política de Privacidad">
      <Section title="1. Responsable del tratamiento">
        <p>Health Coach (en adelante, "la App") es el responsable del tratamiento de los datos personales recogidos a través de esta aplicación, de conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales (LOPDGDD).</p>
      </Section>

      <Section title="2. Datos que recogemos">
        <p className="mb-2">Recogemos los siguientes datos cuando usas la App:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Datos de registro:</strong> email y contraseña (cifrada).</li>
          <li><strong>Datos de perfil:</strong> nombre, fecha de nacimiento, sexo, altura, peso.</li>
          <li><strong>Datos de salud:</strong> objetivos, nivel de actividad, restricciones alimentarias, tratamientos médicos voluntariamente proporcionados, resultados de analíticas subidas por el usuario.</li>
          <li><strong>Datos de uso:</strong> registros de comidas, entrenamientos, sueño, ánimo e hidratación.</li>
          <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, navegador, datos de sesión.</li>
        </ul>
      </Section>

      <Section title="3. Finalidad del tratamiento">
        <ul className="list-disc pl-5 space-y-1">
          <li>Prestación del servicio de coaching de salud personalizado.</li>
          <li>Generación de recomendaciones mediante Inteligencia Artificial.</li>
          <li>Mejora de la aplicación y sus funcionalidades.</li>
          <li>Comunicaciones relacionadas con el servicio (no publicidad sin consentimiento).</li>
        </ul>
      </Section>

      <Section title="4. Base legal">
        <p>El tratamiento se basa en la <strong>ejecución del contrato</strong> (prestación del servicio) y, para datos de salud de categoría especial, en el <strong>consentimiento explícito</strong> del usuario al registrarse y completar su perfil clínico.</p>
      </Section>

      <Section title="5. Datos especialmente protegidos">
        <p>Los datos de salud (peso, analíticas, tratamientos médicos) son categoría especial según el RGPD. Solo se tratan con tu consentimiento explícito, únicamente para la prestación del servicio, y nunca se comparten con terceros para fines comerciales.</p>
      </Section>

      <Section title="6. Destinatarios de los datos">
        <p className="mb-2">Tus datos se almacenan en <strong>Supabase</strong> (infraestructura en la UE). Utilizamos los siguientes proveedores:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase Inc.</strong> — base de datos y autenticación (UE).</li>
          <li><strong>Anthropic PBC</strong> — procesamiento de lenguaje natural para el Coach IA. Los mensajes enviados al Coach se procesan por Anthropic. No almacenamos el historial de conversaciones más allá de la sesión activa.</li>
          <li><strong>Vercel Inc.</strong> — alojamiento del frontend (EE.UU., con garantías adecuadas).</li>
        </ul>
      </Section>

      <Section title="7. Conservación de datos">
        <p>Conservamos tus datos mientras mantengas una cuenta activa. Si eliminas tu cuenta, tus datos se borran en un plazo máximo de 30 días, excepto los que debamos conservar por obligación legal.</p>
      </Section>

      <Section title="8. Tus derechos">
        <p className="mb-2">Puedes ejercer los siguientes derechos en cualquier momento:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
          <li><strong>Supresión:</strong> solicitar el borrado de tus datos.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
          <li><strong>Oposición:</strong> oponerte a determinados tratamientos.</li>
          <li><strong>Retirar el consentimiento</strong> en cualquier momento.</li>
        </ul>
        <p className="mt-2">Para ejercer estos derechos, contacta a través de la App o eliminando tu cuenta desde Configuración.</p>
      </Section>

      <Section title="9. Cookies">
        <p>Usamos cookies esenciales (necesarias para el funcionamiento) y, con tu consentimiento, cookies analíticas. Puedes gestionar tus preferencias en el banner de cookies o en Configuración. Consulta nuestra Política de Cookies para más información.</p>
      </Section>

      <Section title="10. Seguridad">
        <p>Aplicamos medidas técnicas y organizativas adecuadas: cifrado en tránsito (HTTPS/TLS), cifrado en reposo, autenticación segura y control de acceso por roles (RLS en base de datos).</p>
      </Section>

      <Section title="11. Reclamaciones">
        <p>Si consideras que el tratamiento de tus datos no es conforme al RGPD, puedes presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> en www.aepd.es.</p>
      </Section>
    </LegalPage>
  )
}

// ── TÉRMINOS DE USO ──────────────────────────────────────────
export function TermsOfUse() {
  return (
    <LegalPage title="Términos de Uso">
      <Section title="1. Aceptación de los términos">
        <p>Al registrarte y usar Health Coach aceptas estos Términos de Uso. Si no los aceptas, no uses la App.</p>
      </Section>

      <Section title="2. Descripción del servicio">
        <p>Health Coach es una aplicación de apoyo al bienestar personal que utiliza Inteligencia Artificial para proporcionar información y recomendaciones sobre nutrición, entrenamiento y hábitos de salud. <strong>No es un servicio médico profesional.</strong></p>
      </Section>

      <Section title="3. Aviso médico — importante">
        <p className="font-semibold mb-2">HEALTH COACH NO PROPORCIONA CONSEJO MÉDICO.</p>
        <p>La información y recomendaciones generadas por la aplicación y su Coach IA tienen carácter <strong>informativo y orientativo exclusivamente</strong>. No sustituyen en ningún caso la consulta, diagnóstico, tratamiento o prescripción de un médico, nutricionista, dietista u otro profesional sanitario colegiado.</p>
        <p className="mt-2">El usuario asume la responsabilidad exclusiva de las decisiones que tome sobre su salud basándose en la información proporcionada por la App.</p>
      </Section>

      <Section title="4. Elegibilidad">
        <p>Debes tener al menos 18 años para usar Health Coach. Al registrarte declaras ser mayor de edad en tu país de residencia.</p>
      </Section>

      <Section title="5. Cuenta de usuario">
        <p>Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas bajo tu cuenta. Notifícanos inmediatamente si sospechas de acceso no autorizado.</p>
      </Section>

      <Section title="6. Uso aceptable">
        <p className="mb-2">Queda prohibido:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Usar la App para fines ilegales o fraudulentos.</li>
          <li>Intentar acceder a datos de otros usuarios.</li>
          <li>Introducir información falsa que pueda perjudicar recomendaciones de salud.</li>
          <li>Realizar ingeniería inversa o intentar vulnerar la seguridad de la App.</li>
        </ul>
      </Section>

      <Section title="7. Planes y pagos">
        <p>Health Coach ofrece un plan gratuito y un plan Premium de pago. Las condiciones específicas de cada plan se detallan en la página de Precio. Los pagos se procesan a través de Stripe. Los precios incluyen IVA cuando corresponda.</p>
      </Section>

      <Section title="8. Cancelación y reembolsos">
        <p>Puedes cancelar tu suscripción Premium en cualquier momento desde Configuración. No se realizan reembolsos por períodos ya facturados, salvo los 7 días de prueba gratuita inicial.</p>
      </Section>

      <Section title="9. Propiedad intelectual">
        <p>Todo el contenido de la App (textos, diseños, código, marca) es propiedad de Health Coach o sus licenciantes. No se permite su reproducción sin autorización expresa.</p>
      </Section>

      <Section title="10. Limitación de responsabilidad">
        <p>Health Coach no se hace responsable de daños directos, indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la App, incluyendo decisiones de salud tomadas basándose en la información proporcionada.</p>
      </Section>

      <Section title="11. Modificaciones">
        <p>Podemos actualizar estos términos. Te notificaremos por email o mediante aviso en la App. El uso continuado tras la notificación implica aceptación.</p>
      </Section>

      <Section title="12. Legislación aplicable">
        <p>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales españoles competentes.</p>
      </Section>
    </LegalPage>
  )
}

// ── DISCLAIMER MÉDICO (página completa) ─────────────────────
export function MedicalDisclaimerPage() {
  return (
    <LegalPage title="Aviso Médico">
      <Section title="Naturaleza del servicio">
        <p>Health Coach es una <strong>herramienta digital de apoyo al bienestar personal</strong>. No es un producto sanitario, no está homologado como dispositivo médico y no está supervisado por ningún organismo sanitario regulador.</p>
      </Section>
      <Section title="Sobre el Coach IA">
        <p>Las respuestas generadas por el Coach IA de Health Coach se basan en modelos de lenguaje de inteligencia artificial (Anthropic Claude). Estas respuestas pueden contener inexactitudes y no han sido revisadas por profesionales médicos. <strong>Nunca tomes decisiones médicas exclusivamente basándote en las respuestas del Coach IA.</strong></p>
      </Section>
      <Section title="Sobre las analíticas">
        <p>La interpretación automática de resultados de análisis clínicos que ofrece la App es <strong>meramente informativa</strong>. La interpretación clínica de resultados analíticos debe realizarla siempre un médico que conozca tu historial completo.</p>
      </Section>
      <Section title="Poblaciones de riesgo">
        <p>Health Coach no está diseñado para personas con trastornos alimentarios, embarazadas, menores de 18 años, ni personas con condiciones médicas graves. Si perteneces a alguno de estos grupos, consulta con tu médico antes de usar la App.</p>
      </Section>
      <Section title="Emergencias">
        <p>Si tienes una emergencia médica, llama al <strong>112</strong> o acude al servicio de urgencias más cercano. Health Coach no proporciona atención de emergencias.</p>
      </Section>
    </LegalPage>
  )
}
