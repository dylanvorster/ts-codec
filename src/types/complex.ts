import * as defs from '../definitions';
import * as utils from '../utils';
import { codec } from './codec';

const objectAssertion = (data: any) => {
  if (Array.isArray(data)) {
    throw new utils.TransformError(['Expected a map but got an array']);
  }
  if (typeof data !== 'object') {
    throw new utils.TransformError([`Expected a map but got ${typeof data}`]);
  }
};

export const object = <T extends defs.AnyObjectCodecShape>(shape: T): defs.ObjectCodec<T> => {
  const entries = Object.entries(shape);

  const transformer = (transformer: 'encode' | 'decode') => (data: any) => {
    objectAssertion(data);

    return entries.reduce((acc: any, [key, codec]) => {
      const transformed = codec[transformer](data[key]);
      if (transformed !== undefined) {
        acc[key] = transformed;
      }
      return acc;
    }, {}) as any;
  };

  const object = codec(defs.CodecType.Object, transformer('encode'), transformer('decode')) as defs.ObjectCodec<T>;

  object.shape = shape;

  return object;
};

export const record = <T extends defs.AnyCodec>(type: T): defs.RecordCodec<T> => {
  const transformer = (transformer: 'encode' | 'decode') => (data: any) => {
    objectAssertion(data);

    return Object.entries(data).reduce((acc: any, [key, value]) => {
      const transformed = type[transformer](value);
      if (transformed !== undefined) {
        acc[key] = transformed;
      }
      return acc;
    }, {}) as any;
  };

  const record = codec(defs.CodecType.Record, transformer('encode'), transformer('decode')) as defs.RecordCodec<T>;

  record.type = type;

  return record;
};

export const array = <T extends defs.AnyCodec>(element: T): defs.ArrayCodec<T> => {
  const assertion = (data: any) => {
    if (!Array.isArray(data)) {
      throw new utils.TransformError([`Expected an array but got ${typeof data}`]);
    }
  };
  const array = codec(
    defs.CodecType.Array,
    (data) => {
      assertion(data);
      return data.map(element.encode);
    },
    (data) => {
      assertion(data);
      return data.map(element.decode);
    }
  ) as defs.ArrayCodec<T>;

  array.element = element;

  return array;
};
