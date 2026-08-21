/**
 * Ponto de Entrada Central do Domínio de Física (Barrel Export)
 * Agrupa submódulos especializados:
 * - engine: Integrador numérico RK4 e gerador de trajetórias
 * - forces: Decomposição de gravidade, empuxo, arrasto e Coriolis
 * - atmosphere: Modelo ISA e coeficientes compressíveis
 * - monteCarlo: Análise estocástica e cálculo de CEP
 * - unitTests: Validações teóricas e testes de precisão
 * - constants: Constantes físicas universais
 */

export * from './constants';
export * from './atmosphere';
export * from './forces';
export * from './engine';
export * from './monteCarlo';
export * from './interceptor';
export * from './unitTests';
