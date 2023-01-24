import { injectable } from 'tsyringe';

/**
 * Marks a class as injectable, allowing it to be used by
 * DI.
 *
 * It will still need to be registered through a setup file
 * or other method.
 */
export const Injectable = injectable;
