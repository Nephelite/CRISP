import { useState } from 'react';
import {
  IconGitBranch,
  IconHome,
  IconListDetails,
  IconLogout,
  IconSettings2,
  IconUserCircle,
} from '@tabler/icons-react';
import { signOut, useSession } from 'next-auth/react';
import classes from './Sidebar.module.css';
import { Code, Group } from '@mantine/core';
import { useRouter } from 'next/router';
import { User } from 'next-auth';

interface CustomUser extends User {
  role: string;
}

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [active, setActive] = useState('Home');

  const linksData = [
    { link: '/', label: 'Home', icon: IconHome },
    { link: '/courses', label: 'View Courses', icon: IconListDetails },
  ];

  if (
    session &&
    session.user &&
    (session.user as CustomUser).role === 'admin'
  ) {
    linksData.push({ link: '/admin', label: 'Admin', icon: IconSettings2 });
  }

  const links = linksData.map(item => (
    <a
      className={classes.link}
      data-active={item.label === active || undefined}
      href={item.link}
      key={item.label}
      onClick={event => {
        event.preventDefault();
        setActive(item.label);
        router.push(item.link);
      }}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </a>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        <Group className={classes.header} justify="space-between">
          <Group>
            <IconGitBranch size={28} />
            CRISP
          </Group>
          <Code fw={700}>v0.0.1</Code>
        </Group>
        {links}
      </div>

      <div className={classes.footer}>
        <a
          href="#"
          className={classes.link}
          onClick={event => event.preventDefault()}
        >
          <IconUserCircle className={classes.linkIcon} stroke={1.5} />
          <span>
            Hello, {session && session.user ? session.user.name : 'user'}
          </span>
        </a>

        <a href="#" className={classes.link} onClick={() => signOut()}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </a>
      </div>
    </nav>
  );
};

export default Sidebar;
