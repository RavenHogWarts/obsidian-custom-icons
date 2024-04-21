import { LocalProperty } from './types';

export const EN: LocalProperty = {
  custom_settings: "Add Custom Icons",
  custom_settingsDesc: 
    `
    <h5>Brief Description</h5>
    <ul>
      <li>Custom icons support: Online URL or Local relative (absolute) file path or base64 encoding or svg tags. For details, see <a href="https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons/blob/master/README.md" target="_blank">README</a>.</li>
      <li>Lucide source icons support direct use of lucide icon names. For details, see <a href="https://lucide.dev/icons/" target="_blank">lucide</a>.</li>
    </ul>
    `,
  iconLabel: "Icon #{num}",
  fileNamePlaceholder: "Enter file name",
  imagePlaceholder: "Enter icon path",
  type_custom: "Custom Icons",
  type_lucide: "Lucide Original Icons",
  removeButton: "Remove",
  addNewIcon: "Add New Icon"
};