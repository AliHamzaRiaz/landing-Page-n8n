import { OrderIntakeService } from './order-intake.service';

describe('OrderIntakeService.parseMessageAgainstCatalog', () => {
  const service = new OrderIntakeService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  const catalog = [
    { id: 'p1', name: 'Black Kurta', sku: 'KUR-BLK', price: 2000 },
    { id: 'p2', name: 'White Shirt', sku: 'SHT-WHT', price: 1500 },
  ];

  it('extracts quantity and product name', () => {
    const items = service.parseMessageAgainstCatalog(
      'I need 2 Black Kurta please',
      catalog,
    );
    expect(items).toEqual([
      {
        productId: 'p1',
        name: 'Black Kurta',
        quantity: 2,
        unitPrice: 2000,
      },
    ]);
  });

  it('returns null when no product matches', () => {
    expect(
      service.parseMessageAgainstCatalog('hello how are you', catalog),
    ).toBeNull();
  });
});
