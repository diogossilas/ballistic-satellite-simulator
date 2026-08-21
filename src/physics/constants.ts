/**
 * Constantes físicas para o Simulador Balístico Fictício
 */

export const CONSTANTS = {
  // Constante Gravitacional Universal (N·m²/kg²)
  G: 6.67430e-11,

  // Terra padrão (Planeta Base Fictício)
  EARTH_MASS: 5.972e24, // kg
  EARTH_RADIUS: 6371000, // metros (6371 km)
  STANDARD_GRAVITY: 9.80665, // m/s²

  // Atmosfera Padrão Internacional (ISA) ao nível do mar
  SEA_LEVEL_AIR_DENSITY: 1.225, // kg/m³
  SEA_LEVEL_PRESSURE: 101325, // Pa (1 atm)
  SEA_LEVEL_TEMPERATURE: 288.15, // Kelvin (15°C)
  SCALE_HEIGHT: 8500, // metros
  AIR_MOLAR_MASS: 0.0289644, // kg/mol
  UNIVERSAL_GAS_CONSTANT: 8.31446, // J/(mol·K)
  SPECIFIC_HEAT_RATIO_AIR: 1.4, // gamma para ar diatômico
  SPEED_OF_SOUND_SEA_LEVEL: 340.29, // m/s

  // Linha de Kármán (limite convencional do espaço exterior)
  KARMAN_LINE: 100000, // 100 km

  // Equivalência energética (J/kg de TNT) para fins puramente de escala física comparativa
  TNT_JOULES_PER_KG: 4.184e6,

  // Velocidade angular de rotação padrão (Terra: 1 rotação em 86164s)
  STANDARD_ROTATION_RATE: 7.292115e-5, // rad/s
};
