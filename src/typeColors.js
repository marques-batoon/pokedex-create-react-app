// Pokémon type colors — used on the Pokemon detail page and the Compare page.
export const TYPE_COLORS = {
  normal:   { bg: '#A8A878', text: '#fff' },
  fire:     { bg: '#F08030', text: '#fff' },
  water:    { bg: '#6890F0', text: '#fff' },
  electric: { bg: '#F8D030', text: '#333' },
  grass:    { bg: '#78C850', text: '#fff' },
  ice:      { bg: '#98D8D8', text: '#333' },
  fighting: { bg: '#C03028', text: '#fff' },
  poison:   { bg: '#A040A0', text: '#fff' },
  ground:   { bg: '#E0C068', text: '#333' },
  flying:   { bg: '#A890F0', text: '#fff' },
  psychic:  { bg: '#F85888', text: '#fff' },
  bug:      { bg: '#A8B820', text: '#fff' },
  rock:     { bg: '#B8A038', text: '#fff' },
  ghost:    { bg: '#705898', text: '#fff' },
  dragon:   { bg: '#7038F8', text: '#fff' },
  dark:     { bg: '#705848', text: '#fff' },
  steel:    { bg: '#B8B8D0', text: '#333' },
  fairy:    { bg: '#EE99AC', text: '#333' },
  stellar:  { bg: '#40B5A5', text: '#fff' },
  unknown:  { bg: '#68A090', text: '#fff' },
};

export const TypeBadge = ({ type }) => {
  const colors = TYPE_COLORS[type] || TYPE_COLORS.unknown;
  return (
    <span
      className="type-badge"
      style={{ background: colors.bg, color: colors.text }}
    >
      {type}
    </span>
  );
};
