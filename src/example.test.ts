import { ManyToOne, QueryOrder } from '@mikro-orm/core';
import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Manufacturer {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Model {
  @PrimaryKey()
  id!: number;

  @Property()
  modelName!: string;

  @ManyToOne({ entity: () => Manufacturer })
  manufacturer!: Manufacturer;
}

@Entity()
class Equipment {
  @PrimaryKey()
  id!: number;

  @Property()
  displayName!: string;

  @ManyToOne({ entity: () => Model })
  model!: Model;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Equipment, Model, Manufacturer],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const manufacturer = orm.em.create(Manufacturer, { name: 'Manufacturer' });
  const model = orm.em.create(Model, { modelName: 'Model', manufacturer });
  orm.em.create(Equipment, { displayName: 'Equipment', model });
  await orm.em.flush();
  orm.em.clear();

  await expect(
    orm.em.find(Equipment, {})
  ).resolves.toHaveLength(1);

  // This works as expected
  await expect(
    orm.em.find(Equipment, {}, { orderBy: { model: { manufacturer: { name: QueryOrder.ASC } } } })
  ).resolves.toHaveLength(1);

  // This also works as expected
  await expect(
    orm.em.find(Equipment, {}, { populate: ['model.manufacturer'], orderBy: { model: { manufacturer: { name: QueryOrder.ASC } } } })
  ).resolves.toHaveLength(1);

  // This fails with a "no such column" error
  await expect(
    orm.em.find(Equipment, {}, { populate: ['model'], orderBy: { model: { manufacturer: { name: QueryOrder.ASC } } } })
  ).resolves.toHaveLength(1);
});
