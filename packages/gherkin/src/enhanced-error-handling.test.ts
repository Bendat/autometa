import { describe, it, expect } from 'vitest';
import { parseGherkin, GherkinParseError } from './parsers';

describe('Enhanced Error Handling', () => {
  it('should provide detailed error information for malformed gherkin', () => {
    const malformedGherkin = `
Feature: Malformed Feature
  This is not a valid step
  Scenario: Bad scenario
    Given something
    This line is invalid
    When something else
`;

    expect(() => parseGherkin(malformedGherkin)).toThrow(GherkinParseError);
    
    try {
      parseGherkin(malformedGherkin);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GherkinParseError);
      
      const parseError = error as GherkinParseError;
      expect(parseError.errors).toBeDefined();
      expect(parseError.errors.length).toBeGreaterThan(0);
      
      // Should have detailed error message
      const detailedMessage = parseError.getDetailedMessage();
      expect(detailedMessage).toContain('Parse errors:');
      expect(detailedMessage).toContain('line');
      
      // Check that error has location information
      expect(parseError.errors.length).toBeGreaterThan(0);
      const firstError = parseError.errors[0];
      if (firstError) {
        expect(firstError.message).toBeDefined();
        expect(typeof firstError.line).toBe('number');
      }
    }
  });

  it('should handle completely invalid gherkin gracefully', () => {
    const invalidGherkin = `
This is not gherkin at all
Just some random text
Without any structure
`;

    expect(() => parseGherkin(invalidGherkin)).toThrow(GherkinParseError);
    
    try {
      parseGherkin(invalidGherkin);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GherkinParseError);
      
      const parseError = error as GherkinParseError;
      expect(parseError.message).toContain('Failed to parse gherkin content');
      expect(parseError.errors.length).toBeGreaterThan(0);
      
      // Should provide helpful error message
      const detailedMessage = parseError.getDetailedMessage();
      expect(detailedMessage.length).toBeGreaterThan(parseError.message.length);
    }
  });

  it('should handle empty content gracefully', () => {
    const emptyGherkin = '';

    expect(() => parseGherkin(emptyGherkin)).toThrow(GherkinParseError);
    
    try {
      parseGherkin(emptyGherkin);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GherkinParseError);
      
      const parseError = error as GherkinParseError;
      expect(parseError.message).toContain('Failed to parse gherkin content');
    }
  });

  it('should handle missing feature keyword', () => {
    const noFeatureGherkin = `
Scenario: Test scenario
  Given something
  When something happens
  Then it works
`;

    expect(() => parseGherkin(noFeatureGherkin)).toThrow(GherkinParseError);
    
    try {
      parseGherkin(noFeatureGherkin);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GherkinParseError);
      
      const parseError = error as GherkinParseError;
      expect(parseError.errors.length).toBeGreaterThan(0);
      
      // Should provide line number information
      expect(parseError.errors.length).toBeGreaterThan(0);
      const firstError = parseError.errors[0];
      if (firstError) {
        expect(typeof firstError.line).toBe('number');
        expect(firstError.line).toBeGreaterThan(0);
      }
    }
  });
});
