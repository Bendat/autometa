import { IsString } from 'class-validator';
import { AbstractDtoBuilder } from './abstract-builder';
import { Property } from './dto-decorators';
import { FailedValidationError } from './errors/validation-errors';

describe('AbstractDtoBuilder', () => {
  class TestDto {
    @IsString()
    @Property
    name!: string;
  }

  class TestDtoBuilder extends AbstractDtoBuilder<TestDto> {
    name = (name: string) => this.set('name')(name);
    constructor(instance?: TestDto) {
      super(TestDto, instance);
    }
  }

  describe('set', () => {
    it('should set the value of `name` on the dto', () => {
      const dto = new TestDto();
      const builder = new TestDtoBuilder(dto);
      builder.name('bob');
      expect(dto.name).toBe('bob');
    });
  });

  describe('build', () => {
    it('should build a valid DTO', () => {
      const dto = new TestDto();
      const builder = new TestDtoBuilder(dto);
      const name = builder.name('bob').build().name;
      expect(name).toBe('bob');
    });

    it('should error when building an invalid DTO', () => {
      const dto = new TestDto();
      const builder = new TestDtoBuilder(dto);
      try {
        builder.build();
      } catch (e) {
        const { validationErrors } = e as FailedValidationError;
        const [error] = validationErrors;
        expect(validationErrors.length).toBe(1);
        expect(error).toBeDefined();
        expect(error.property).toBe('name');
        expect(error.constraints?.isString).toBe('name must be a string');
      } finally {
        expect.assertions(4);
      }
    });

    it('should ignore validation errors when building with validate=false', () => {
      const dto = new TestDto();
      const builder = new TestDtoBuilder(dto);
      const name = builder.build(false).name;
      expect(name).toBe(undefined);
    });
  });
});
