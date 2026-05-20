/**
 * PandaImage — muestra una imagen del panda con fallback a emoji.
 *
 * Uso:
 *   <PandaImage name="meditate_1" size={120} />
 *   <PandaImage name="breath_2" size={80} className="..." style={{...}} />
 *
 * Los archivos van en:  web/public/panda/<name>.png
 * Consulta GUIA_GENERAR_ASSETS_PANDA.md para los prompts de generación.
 */

// Emoji fallback por nombre de asset
const FALLBACKS = {
  panda_base:       '🐼',
  talk_1:           '🐼',
  talk_2:           '🐼',
  breath_1:         '🐼',
  breath_2:         '🐼',
  breath_3:         '🐼',
  breath_4:         '🐼',
  meditate_1:       '🧘',
  meditate_2:       '🧘',
  celebrate_1:      '🎉',
  celebrate_2:      '🥰',
  coach_explain_1:  '🐼',
  coach_point_1:    '👍',
  encourage_1:      '💪',
  happy_1:          '😄',
  sleep_1:          '😴',
  curious_1:        '🤔',
  thinking_1:       '💭',
  surprised_1:      '😲',
  sad_1:            '😔',
  love_1:           '🥰',
  bye_1:            '👋',
  bye_2:            '🐼',
  avatar_neutro:    '🐼',
  avatar_happy:     '😊',
  avatar_wink:      '😉',
  avatar_love:      '🥰',
  avatar_thinking:  '🤔',
  avatar_sleep:     '😴',
  avatar_celebrate: '🎉',
  avatar_coach:     '💪',
}

export default function PandaImage({ name, size = 80, className = '', style = {}, alt }) {
  const src      = `/panda/${name}.png`
  const fallback = FALLBACKS[name] || '🐼'

  return (
    <div
      className={className}
      style={{
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt || name}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={e => {
          // Si el PNG no existe, muestra el emoji en su lugar
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextSibling.style.display = 'flex'
        }}
      />
      <span style={{
        display: 'none',
        width: '100%', height: '100%',
        alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.6,
        lineHeight: 1,
      }}>
        {fallback}
      </span>
    </div>
  )
}
