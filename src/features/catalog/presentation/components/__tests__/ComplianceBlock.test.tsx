import { render, screen } from '@testing-library/react-native'

import { ComplianceBlock } from '../ComplianceBlock'
import { aCompliance } from '../testing/detail-fixture'

describe('ComplianceBlock', () => {
  it('pinta el fabricante con su dirección y su correo', async () => {
    await render(<ComplianceBlock compliance={aCompliance()} />)

    expect(screen.getByText('Ningbo Textil Co. Ltd')).toBeOnTheScreen()
    expect(screen.getByText('Calle Fabril 12, Ningbo, China')).toBeOnTheScreen()
    expect(screen.getByText('compliance@ningbo-textil.test')).toBeOnTheScreen()
  })

  it('pinta la persona responsable en la UE con su cargo ya traducido', async () => {
    await render(<ComplianceBlock compliance={aCompliance()} />)

    expect(screen.getByText('NX036 Europe SL')).toBeOnTheScreen()
    expect(screen.getByText(' · Importador')).toBeOnTheScreen()
    expect(screen.getByText('Gran Vía 1, 28013 Madrid (ES)')).toBeOnTheScreen()
    expect(screen.getByText('ue@nx036.test')).toBeOnTheScreen()
  })

  // El art. 19.d del Reglamento (UE) 2023/988 exige la advertencia en la propia oferta: tiene que
  // verse sin abrir nada.
  it('pinta las advertencias de seguridad a la vista, sin desplegable', async () => {
    await render(<ComplianceBlock compliance={aCompliance()} />)

    expect(screen.getByTestId('compliance-safety-warnings')).toBeOnTheScreen()
    expect(screen.getByText('No apto para menores de 3 años.')).toBeOnTheScreen()
    expect(screen.getByText('Manténgase alejado del fuego.')).toBeOnTheScreen()
  })

  it('sin datos de cumplimiento no pinta nada', async () => {
    await render(<ComplianceBlock />)

    expect(screen.queryByTestId('compliance-identity')).toBeNull()
    expect(screen.queryByTestId('compliance-safety-warnings')).toBeNull()
  })

  it('con el bloque vacío tampoco pinta nada', async () => {
    await render(
      <ComplianceBlock
        compliance={{
          manufacturerComplete: false,
          safetyWarnings: [],
        }}
      />,
    )

    expect(screen.queryByTestId('compliance-identity')).toBeNull()
    expect(screen.queryByTestId('compliance-safety-warnings')).toBeNull()
  })

  it('con solo advertencias pinta el aviso y omite la identidad', async () => {
    await render(
      <ComplianceBlock
        compliance={{
          manufacturerComplete: false,
          safetyWarnings: ['Contiene piezas pequeñas.'],
        }}
      />,
    )

    expect(screen.getByText('Contiene piezas pequeñas.')).toBeOnTheScreen()
    expect(screen.queryByTestId('compliance-identity')).toBeNull()
  })

  it('con el fabricante a medias pinta su nombre y omite lo que falta', async () => {
    await render(
      <ComplianceBlock
        compliance={{
          manufacturerName: 'Taller sin datos SL',
          manufacturerComplete: false,
          safetyWarnings: [],
        }}
      />,
    )

    expect(screen.getByText('Taller sin datos SL')).toBeOnTheScreen()
    expect(screen.queryByText('Operador económico responsable en la UE')).toBeNull()
  })

  it('sin código postal la dirección del responsable sigue siendo legible', async () => {
    await render(
      <ComplianceBlock
        compliance={aCompliance({
          responsiblePerson: {
            name: 'NX036 Europe SL',
            addressLine: 'Gran Vía 1',
            city: 'Madrid',
            country: 'ES',
            email: 'ue@nx036.test',
            roleLabel: 'Importador',
          },
        })}
      />,
    )

    expect(screen.getByText('Gran Vía 1, Madrid (ES)')).toBeOnTheScreen()
  })

  it('sin fabricante pero con responsable en la UE pinta solo lo que hay', async () => {
    await render(
      <ComplianceBlock
        compliance={aCompliance({ manufacturerName: undefined, safetyWarnings: [] })}
      />,
    )

    expect(screen.getByTestId('compliance-identity')).toBeOnTheScreen()
    expect(screen.queryByText('Fabricante')).toBeNull()
    expect(screen.getByText('NX036 Europe SL')).toBeOnTheScreen()
  })
})
