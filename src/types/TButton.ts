export type ButtonProps = {
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'white' | 'primaryLine' | 'secondaryLine';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  costume?: boolean;
};