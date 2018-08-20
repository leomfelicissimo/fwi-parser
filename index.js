const fs = require('fs');

const getPositionValue = (row, position, length) => row.substr(position, length);

const getRowValue = (row, { getValue, position }) =>
  getValue ?
    getValue(getPositionValue(row, ...position)):
    getPositionValue(row, ...position);

const parseLayout = (descriptor, row) =>
  Object.keys(descriptor).reduce((previous, current) => {
    const descriptorProperty = descriptor[current];

    const result = Array.isArray(descriptorProperty.position) ?
      Object.assign(previous, { [current]: getRowValue(row, descriptorProperty) }):
      previous;

    return result;
  }, {});

const parseRowsLayout = (fileRows, filter, layoutDescriptors) => {
  const results = fileRows
    .filter(filter)
    .reduce((result, row) => {
      const parsed = layoutDescriptors.reduce((prev, { descriptor, condition }) =>
        condition(row) ? parseLayout(descriptor, row) : prev
      , undefined);
      if (parsed) result.push(parsed);
      return result;
    }, []);

  return results;
}

const loadFile = (filePath, encoding) => {
  const file = fs.readFileSync(filePath, { encoding });
  const fileContent = typeof file === 'String' ? file : file.toString();
  const fileRows = fileContent.split(/\r\n|\r|\n/g);
  return fileRows;
};

exports.getPositionValue = getPositionValue;

exports.LayoutDescriptor = () => {
  return {
    addProperty(name, position, length, getValue) {
      this[name] = {
        position: [position, length],
        getValue,
      };
      return this;
    }
  };
};

exports.LayoutFileParse = (options = {
  filePath: '',
  encoding: '',
  filter: undefined,
}) => {
  const layouts = [];

  return {
    addLayout(descriptor, condition) {
      layouts.push({ descriptor, condition });
      return this;
    },

    parse() {
      const dataRows = loadFile(options.filePath, options.encoding);
      return parseRowsLayout(dataRows, options.filter, layouts);
    }
  }
}
